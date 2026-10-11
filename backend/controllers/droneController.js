const Drone = require('../models/Drone');
const DroneDetection = require('../models/DroneDetection');
const SOS = require('../models/SOS');
const AuditLog = require('../models/AuditLog');
const { simulateDroneScanStep, SIMULATED_VICTIM_HOTSPOTS } = require('../services/droneSimulator');
const { calculatePriorityScore } = require('../services/priorityEngine');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get all drones and recent detections
// @route   GET /api/drones
// @access  Public / Private
const getDrones = async (req, res, next) => {
  try {
    const drones = await Drone.find();
    const detections = await DroneDetection.find().sort({ detectedAt: -1 }).limit(30);

    res.json({
      success: true,
      drones,
      detections,
      hotspotsAvailable: SIMULATED_VICTIM_HOTSPOTS
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger simulated drone scan sweep in sector
// @route   POST /api/drones/detect
// @access  Public / Private
const triggerDroneScan = async (req, res, next) => {
  try {
    const { droneId, sector } = req.body;

    let drone = await Drone.findOne({ droneId });
    if (drone && sector) {
      drone.currentSector = sector;
      await drone.save();
    }

    const { drone: updatedDrone, detection, hotspot } = await simulateDroneScanStep(droneId);

    // Emit Real-Time Socket.IO Alert
    emitEvent('drone:detection', {
      drone: updatedDrone,
      detection,
      hotspot
    });

    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Drone Recon Station',
      role: 'SYSTEM',
      action: 'DRONE_THERMAL_DETECTION',
      entity: 'DRONE',
      entityId: detection.detectionId,
      details: `FLIR Thermal Signature (${detection.heatSignatureTempC}°C, ${detection.confidence}% confidence) detected in ${detection.sector}`
    });

    res.status(201).json({
      success: true,
      message: 'Autonomous Drone Recon sweep completed. Thermal signature detected.',
      drone: updatedDrone,
      detection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert drone detection into an official SOS emergency incident
// @route   POST /api/drones/detection/:id/convert-to-sos
// @access  Private (Command HQ / Admin)
const convertDetectionToSOS = async (req, res, next) => {
  try {
    const detection = await DroneDetection.findById(req.params.id);
    if (!detection) {
      return res.status(404).json({ success: false, message: 'Detection record not found' });
    }

    if (detection.status === 'CONVERTED_TO_SOS') {
      return res.status(400).json({ success: false, message: 'Detection has already been converted to an SOS' });
    }

    const priority = calculatePriorityScore({
      severity: 'CRITICAL',
      affectedCount: detection.estimatedVictims,
      hasInjuries: true,
      floodWaterLevel: 1.8
    });

    const sosId = `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sos = new SOS({
      sosId,
      citizenName: `Unreported Victim (${detection.sector} UAV Recon)`,
      citizenPhone: 'DRONE-RECON-SURVEILLANCE',
      disasterType: 'FLOOD',
      severity: 'CRITICAL',
      affectedCount: detection.estimatedVictims,
      hasInjuries: true,
      floodWaterLevel: 1.8,
      description: `[AUTONOMOUS DRONE FLIR RECON] Thermal heat signature ${detection.heatSignatureTempC}°C detected with ${detection.confidence}% confidence by ${detection.droneName}. Unreported victims stranded on roof/structure.`,
      latitude: detection.location.latitude,
      longitude: detection.location.longitude,
      address: `Thermal Hotspot in ${detection.sector}`,
      priorityScore: priority.score,
      priorityLevel: priority.priorityLevel,
      scoreBreakdown: priority.breakdown,
      status: 'PENDING'
    });

    await sos.save();

    // Mark detection converted
    detection.status = 'CONVERTED_TO_SOS';
    detection.createdSosId = sos.sosId;
    await detection.save();

    emitEvent('sos:new', sos);
    emitEvent('drone:detection_converted', { detection, sos });

    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Command Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'DRONE_DETECTION_CONVERTED',
      entity: 'SOS',
      entityId: sos.sosId,
      details: `UAV thermal detection ${detection.detectionId} converted to emergency SOS ${sos.sosId}`
    });

    res.json({
      success: true,
      message: `Thermal detection successfully escalated to SOS ${sos.sosId}`,
      sos,
      detection
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update drone status (IDLE, PATROLLING, SCANNING, RETURNING)
// @route   PUT /api/drones/:id
// @access  Private (Command HQ / Admin)
const updateDrone = async (req, res, next) => {
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!drone) return res.status(404).json({ success: false, message: 'Drone not found' });
    emitEvent('drone:updated', drone);
    res.json({ success: true, drone });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrones,
  triggerDroneScan,
  convertDetectionToSOS,
  updateDrone
};
