const Disaster = require('../models/Disaster');
const HazardZone = require('../models/HazardZone');
const Shelter = require('../models/Shelter');
const Hospital = require('../models/Hospital');
const AuditLog = require('../models/AuditLog');
const { emitEvent } = require('../sockets/socketHandler');

// Roads with flood risk thresholds for simulation
const MONITORED_ROADS = [
  { id: 'road-riverside-avenue', name: 'Riverside Causeway', elevation: 1.2, threshold: 1.0 },
  { id: 'road-bridge-beta', name: 'Beta Causeway Bridge', elevation: 2.2, threshold: 2.0 },
  { id: 'road-south-corridor', name: 'South Harbor Corridor', elevation: 2.8, threshold: 2.5 },
  { id: 'road-north-artery', name: 'North Grand Trunk Road', elevation: 12.5, threshold: 4.0 }
];

// Helper to calculate impact of water surge level
async function computeFloodImpact(surgeLevel) {
  const waterLevel = parseFloat(surgeLevel);

  // 1. Affected Shelters
  const allShelters = await Shelter.find();
  const affectedShelters = allShelters.filter(s => waterLevel >= (s.floodRiskThreshold || 2.0));

  // 2. Affected Hospitals
  const allHospitals = await Hospital.find();
  const affectedHospitals = allHospitals.filter(h => waterLevel >= (h.floodRiskThreshold || 2.5));

  // 3. Affected Roads
  const affectedRoads = MONITORED_ROADS.filter(r => waterLevel >= r.threshold);

  // 4. Affected Population Estimate (exponential curve with surge height)
  const basePop = 40000;
  const surgeMultiplier = Math.pow(waterLevel + 1, 1.8);
  const affectedPopulation = Math.round(basePop * surgeMultiplier);

  // 5. Expand hazard polygon scaling factor (1.0 at 0m, up to 1.6 at 3.0m)
  const expansionFactor = parseFloat((1.0 + (waterLevel / 3.0) * 0.6).toFixed(2));

  return {
    surgeLevel: waterLevel,
    expansionFactor,
    affectedPopulation,
    affectedShelters: affectedShelters.map(s => ({ id: s._id, name: s.name, occupancy: s.currentOccupancy, elevation: s.elevation })),
    affectedHospitals: affectedHospitals.map(h => ({ id: h._id, name: h.name, bedsAtRisk: h.emergencyBedsTotal, elevation: h.elevation })),
    affectedRoads: affectedRoads.map(r => ({ id: r.id, name: r.name, elevation: r.elevation, status: 'SUBMERGED_BLOCKED' })),
    severityClassification: waterLevel >= 2.2 ? 'CATASTROPHIC_SURGE' : waterLevel >= 1.5 ? 'CRITICAL_FLOOD' : waterLevel >= 0.8 ? 'HIGH_INUNDATION' : 'MODERATE_SURGE'
  };
}

// @desc    Get active disasters
// @route   GET /api/disasters
// @access  Public
const getDisasters = async (req, res, next) => {
  try {
    const disasters = await Disaster.find().sort({ active: -1, declaredAt: -1 });
    const hazardZones = await HazardZone.find();
    res.json({
      success: true,
      count: disasters.length,
      disasters,
      hazardZones
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new disaster
// @route   POST /api/disasters
// @access  Private (Admin / Command HQ)
const createDisaster = async (req, res, next) => {
  try {
    const disaster = await Disaster.create(req.body);
    emitEvent('disaster:new', disaster);
    res.status(201).json({ success: true, disaster });
  } catch (error) {
    next(error);
  }
};

// @desc    Update disaster status or water surge level (Dynamic Flood Water Surge Simulator)
// @route   PUT /api/disasters/:id
// @access  Private (Command HQ / Admin)
const updateDisaster = async (req, res, next) => {
  try {
    let disaster = await Disaster.findById(req.params.id);
    if (!disaster) {
      // Fallback to active disaster if ID is 'active'
      if (req.params.id === 'active') {
        disaster = await Disaster.findOne({ active: true });
      }
      if (!disaster) return res.status(404).json({ success: false, message: 'Disaster event not found' });
    }

    const { waterSurgeLevel, active, severity, name } = req.body;

    if (waterSurgeLevel !== undefined) {
      disaster.waterSurgeLevel = parseFloat(waterSurgeLevel);
    }
    if (active !== undefined) disaster.active = Boolean(active);
    if (severity) disaster.severity = severity;
    if (name) disaster.name = name;

    await disaster.save();

    // Compute dynamic impact
    const impact = await computeFloodImpact(disaster.waterSurgeLevel);

    // Emit Real-Time Socket Event
    emitEvent('flood:surge_updated', {
      disaster,
      impact
    });

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Command Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'FLOOD_SURGE_SIMULATION_UPDATED',
      entity: 'DISASTER',
      entityId: disaster._id.toString(),
      details: `Water surge level updated to ${disaster.waterSurgeLevel}m (Affected pop: ~${impact.affectedPopulation}, Shelters at risk: ${impact.affectedShelters.length})`
    });

    res.json({
      success: true,
      message: `Flood surge updated to ${disaster.waterSurgeLevel}m`,
      disaster,
      impact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate flood surge impact on the fly for simulation
// @route   POST /api/disasters/simulate-surge
// @access  Public / Private
const simulateSurge = async (req, res, next) => {
  try {
    const { waterSurgeLevel } = req.body;
    const impact = await computeFloodImpact(waterSurgeLevel !== undefined ? waterSurgeLevel : 1.5);
    res.json({
      success: true,
      impact
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDisasters,
  createDisaster,
  updateDisaster,
  simulateSurge
};
