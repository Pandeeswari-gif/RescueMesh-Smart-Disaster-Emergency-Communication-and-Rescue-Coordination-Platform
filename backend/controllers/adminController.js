const User = require('../models/User');
const SOS = require('../models/SOS');
const RescueTeam = require('../models/RescueTeam');
const Shelter = require('../models/Shelter');
const Hospital = require('../models/Hospital');
const Resource = require('../models/Resource');
const Disaster = require('../models/Disaster');
const AuditLog = require('../models/AuditLog');

// @desc    Get system-wide analytics computed from live database
// @route   GET /api/admin/analytics
// @access  Private (Command HQ / Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalSOS,
      criticalSOS,
      highSOS,
      pendingSOS,
      dispatchedSOS,
      resolvedSOS,
      allSOS,
      teams,
      shelters,
      hospitals,
      resources,
      activeDisaster
    ] = await Promise.all([
      SOS.countDocuments(),
      SOS.countDocuments({ priorityLevel: 'CRITICAL' }),
      SOS.countDocuments({ priorityLevel: 'HIGH' }),
      SOS.countDocuments({ status: 'PENDING' }),
      SOS.countDocuments({ status: { $in: ['DISPATCHED', 'ON_ROUTE', 'ON_SITE', 'RESCUING'] } }),
      SOS.countDocuments({ status: 'RESOLVED' }),
      SOS.find({}, 'severity disasterType priorityLevel status createdAt resolvedAt'),
      RescueTeam.find(),
      Shelter.find(),
      Hospital.find(),
      Resource.find(),
      Disaster.findOne({ active: true })
    ]);

    // 1. Severity Distribution
    const severityDist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    allSOS.forEach(s => {
      const sev = s.priorityLevel || 'LOW';
      severityDist[sev] = (severityDist[sev] || 0) + 1;
    });

    // 2. Disaster Type Distribution
    const disasterTypeDist = {};
    allSOS.forEach(s => {
      const type = s.disasterType || 'FLOOD';
      disasterTypeDist[type] = (disasterTypeDist[type] || 0) + 1;
    });

    // 3. Rescue Team Utilization
    const totalTeams = teams.length;
    const activeTeams = teams.filter(t => t.status !== 'AVAILABLE' && t.status !== 'OFFLINE').length;
    const teamUtilizationPct = totalTeams > 0 ? Math.round((activeTeams / totalTeams) * 100) : 0;

    // 4. Shelter Capacity Aggregate
    let totalShelterCap = 0;
    let totalShelterOcc = 0;
    shelters.forEach(s => {
      totalShelterCap += s.totalCapacity;
      totalShelterOcc += s.currentOccupancy;
    });
    const shelterOccupancyPct = totalShelterCap > 0 ? Math.round((totalShelterOcc / totalShelterCap) * 100) : 0;

    // 5. Hospital Capacity Aggregate
    let totalIcu = 0;
    let availIcu = 0;
    let totalGen = 0;
    let availGen = 0;
    let totalEmerg = 0;
    let availEmerg = 0;
    let totalOxygen = 0;
    let totalAmbulances = 0;

    hospitals.forEach(h => {
      totalIcu += h.icuBedsTotal;
      availIcu += h.icuBedsAvailable;
      totalGen += h.generalBedsTotal;
      availGen += h.generalBedsAvailable;
      totalEmerg += h.emergencyBedsTotal;
      availEmerg += h.emergencyBedsAvailable;
      totalOxygen += h.oxygenCylindersAvailable || 0;
      totalAmbulances += h.ambulancesAvailable || 0;
    });

    // 6. Average Response Time Calculation (for resolved SOS)
    const resolvedWithTimes = allSOS.filter(s => s.status === 'RESOLVED' && s.resolvedAt);
    let avgResponseTimeMin = 18; // baseline average in mins
    if (resolvedWithTimes.length > 0) {
      const totalMinutes = resolvedWithTimes.reduce((acc, s) => {
        const diffMs = new Date(s.resolvedAt).getTime() - new Date(s.createdAt).getTime();
        return acc + Math.max(1, Math.round(diffMs / (1000 * 60)));
      }, 0);
      avgResponseTimeMin = Math.round(totalMinutes / resolvedWithTimes.length);
    }

    // 7. Resource Utilization
    const totalResources = resources.length;
    const allocatedResources = resources.filter(r => r.status === 'ALLOCATED' || r.status === 'IN_TRANSIT').length;

    res.json({
      success: true,
      summary: {
        totalSOS,
        criticalSOS,
        highSOS,
        pendingSOS,
        dispatchedSOS,
        resolvedSOS,
        activeDisaster: activeDisaster ? activeDisaster.name : 'No Active Disaster',
        waterSurgeLevel: activeDisaster ? activeDisaster.waterSurgeLevel : 0.0,
        avgResponseTimeMin
      },
      severityDist,
      disasterTypeDist,
      teams: {
        total: totalTeams,
        active: activeTeams,
        available: totalTeams - activeTeams,
        utilizationPct: teamUtilizationPct
      },
      shelters: {
        totalCapacity: totalShelterCap,
        currentOccupancy: totalShelterOcc,
        availableBeds: Math.max(0, totalShelterCap - totalShelterOcc),
        occupancyPct: shelterOccupancyPct
      },
      hospitals: {
        totalIcu,
        availIcu,
        totalGen,
        availGen,
        totalEmerg,
        availEmerg,
        totalOxygen,
        totalAmbulances
      },
      resources: {
        total: totalResources,
        allocated: allocatedResources,
        available: totalResources - allocatedResources
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user list
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or status
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { role, status, name, phone } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (role) user.role = role;
    if (status) user.status = status;
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      role: 'ADMIN',
      action: 'USER_MODIFIED',
      entity: 'USER',
      entityId: user._id.toString(),
      details: `Updated user ${user.email} (Role: ${user.role}, Status: ${user.status})`
    });

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit
// @access  Private (Admin / Command HQ)
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, limit } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10) || 100);

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  updateUser,
  getAuditLogs
};
