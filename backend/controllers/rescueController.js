const RescueTeam = require('../models/RescueTeam');
const RescueAssignment = require('../models/RescueAssignment');
const SOS = require('../models/SOS');
const Disaster = require('../models/Disaster');
const AuditLog = require('../models/AuditLog');
const { planSafeRescueRoute, haversineKm } = require('../services/routeEngine');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get all rescue teams, optionally sorted by distance to coordinates
// @route   GET /api/rescue-teams
// @access  Public / Private
const getRescueTeams = async (req, res, next) => {
  try {
    const { status, lat, lng } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let teams = await RescueTeam.find(filter).populate('activeSos');

    if (lat && lng) {
      const refLat = parseFloat(lat);
      const refLng = parseFloat(lng);
      teams = teams.map(team => {
        const teamObj = team.toObject();
        teamObj.distanceKm = parseFloat(haversineKm(refLat, refLng, team.location.latitude, team.location.longitude).toFixed(2));
        return teamObj;
      }).sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispatch rescue team to an SOS
// @route   POST /api/rescue-assignments
// @access  Private (Command HQ / Admin)
const dispatchRescueTeam = async (req, res, next) => {
  try {
    const { sosId, teamId, notes } = req.body;

    const sos = await SOS.findById(sosId);
    if (!sos) return res.status(404).json({ success: false, message: 'SOS not found' });

    const team = await RescueTeam.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Rescue team not found' });

    // Fetch active disaster water level for routing
    const activeDisaster = await Disaster.findOne({ active: true });
    const currentSurge = activeDisaster ? activeDisaster.waterSurgeLevel : 1.2;

    // Plan safe rescue route
    const routePlan = planSafeRescueRoute(
      team.location.latitude,
      team.location.longitude,
      sos.latitude,
      sos.longitude,
      currentSurge
    );

    // Create Rescue Assignment
    const assignment = new RescueAssignment({
      sos: sos._id,
      team: team._id,
      dispatchedBy: req.user ? req.user._id : null,
      routeCoordinates: routePlan.routeCoordinates,
      avoidedHazards: routePlan.avoidedHazards,
      estimatedDistanceKm: routePlan.distanceKm,
      estimatedTimeMin: routePlan.etaMinutes,
      status: 'DISPATCHED',
      statusTimeline: [
        {
          status: 'DISPATCHED',
          timestamp: new Date(),
          note: `Dispatched by ${req.user ? req.user.name : 'Command Operations'}`
        }
      ],
      notes: notes || ''
    });

    await assignment.save();

    // Update SOS
    sos.status = 'DISPATCHED';
    sos.assignedTeam = team._id;
    await sos.save();

    // Update Rescue Team
    team.status = 'DISPATCHED';
    team.activeSos = sos._id;
    await team.save();

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Command Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'TEAM_DISPATCHED',
      entity: 'RESCUE_TEAM',
      entityId: team._id.toString(),
      details: `Team ${team.name} dispatched to ${sos.sosId} (Route ETA: ${routePlan.etaMinutes} mins)`
    });

    // Real-Time Socket Emitters
    emitEvent('rescue:dispatched', {
      assignment,
      sos,
      team,
      routePlan
    });
    emitEvent('sos:updated', sos);
    emitEvent('team:status_changed', team);

    res.status(201).json({
      success: true,
      message: `Rescue team ${team.name} dispatched successfully`,
      assignment,
      routePlan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update rescue assignment & team operational status
// @route   PUT /api/rescue-assignments/:id
// @access  Private (Rescue Team / Command HQ / Admin)
const updateRescueAssignmentStatus = async (req, res, next) => {
  try {
    const { status, note, currentLocation } = req.body;
    const assignment = await RescueAssignment.findById(req.params.id)
      .populate('sos')
      .populate('team');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found' });
    }

    if (status) {
      assignment.status = status;
      assignment.statusTimeline.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status}`
      });

      // Update Team Status
      const team = await RescueTeam.findById(assignment.team._id);
      if (team) {
        team.status = status;
        if (currentLocation && currentLocation.lat && currentLocation.lng) {
          team.location = { latitude: currentLocation.lat, longitude: currentLocation.lng };
        }
        if (status === 'COMPLETED') {
          team.status = 'AVAILABLE';
          team.activeSos = null;
        }
        await team.save();
        emitEvent('team:status_changed', team);
      }

      // Update SOS Status in tandem
      const sos = await SOS.findById(assignment.sos._id);
      if (sos) {
        if (status === 'ON_ROUTE') sos.status = 'ON_ROUTE';
        else if (status === 'ON_SITE') sos.status = 'ON_SITE';
        else if (status === 'RESCUING') sos.status = 'RESCUING';
        else if (status === 'COMPLETED') {
          sos.status = 'RESOLVED';
          sos.resolvedAt = new Date();
        }
        await sos.save();
        emitEvent('sos:updated', sos);
      }
    }

    await assignment.save();

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Rescue Operator',
      role: req.user ? req.user.role : 'RESCUE_TEAM',
      action: 'RESCUE_STATUS_UPDATE',
      entity: 'RESCUE_ASSIGNMENT',
      entityId: assignment._id.toString(),
      details: `Rescue status updated to ${status}`
    });

    emitEvent('assignment:updated', assignment);

    res.json({
      success: true,
      message: `Assignment updated to ${status}`,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate safe rescue navigation route
// @route   POST /api/rescue/safe-route
// @access  Public / Private
const getSafeRoute = async (req, res, next) => {
  try {
    const { startLat, startLng, destLat, destLng, waterSurgeLevel } = req.body;

    if (startLat === undefined || destLat === undefined) {
      return res.status(400).json({ success: false, message: 'Start and destination coordinates are required' });
    }

    const routePlan = planSafeRescueRoute(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(destLat),
      parseFloat(destLng),
      parseFloat(waterSurgeLevel || 1.2)
    );

    res.json({
      success: true,
      routePlan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments for the logged in rescue team
// @route   GET /api/rescue/my-assignment
// @access  Private
const getMyAssignment = async (req, res, next) => {
  try {
    // Find team associated with user
    const team = await RescueTeam.findOne({ accountUser: req.user._id });
    if (!team) {
      // Fallback: grab first team for seamless demo
      const fallbackTeam = await RescueTeam.findOne();
      const assignment = await RescueAssignment.findOne({ team: fallbackTeam._id, status: { $ne: 'COMPLETED' } })
        .populate('sos')
        .populate('team')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        team: fallbackTeam,
        assignment
      });
    }

    const assignment = await RescueAssignment.findOne({ team: team._id, status: { $ne: 'COMPLETED' } })
      .populate('sos')
      .populate('team')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      team,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRescueTeams,
  dispatchRescueTeam,
  updateRescueAssignmentStatus,
  getSafeRoute,
  getMyAssignment
};
