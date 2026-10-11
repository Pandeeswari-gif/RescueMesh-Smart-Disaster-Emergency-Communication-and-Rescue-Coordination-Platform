const SOS = require('../models/SOS');
const AuditLog = require('../models/AuditLog');
const { calculatePriorityScore } = require('../services/priorityEngine');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Submit Emergency SOS
// @route   POST /api/sos
// @access  Public or Protected
const createSOS = async (req, res, next) => {
  try {
    const {
      citizenName,
      citizenPhone,
      disasterType,
      severity,
      affectedCount,
      hasInjuries,
      floodWaterLevel,
      vulnerability,
      description,
      latitude,
      longitude,
      address,
      isOfflineQueued
    } = req.body;

    if (!citizenName || !citizenPhone) {
      return res.status(400).json({ success: false, message: 'Victim name and contact phone are required' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Valid GPS latitude and longitude are required' });
    }

    // Generate unique readable SOS ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sosId = `SOS-${new Date().getFullYear()}-${randomSuffix}`;

    // Calculate AI-Assisted Priority Score
    const priorityResult = calculatePriorityScore({
      severity: severity || 'MEDIUM',
      affectedCount: affectedCount || 1,
      hasInjuries,
      floodWaterLevel,
      vulnerability
    });

    const sos = new SOS({
      sosId,
      citizen: req.user ? req.user._id : null,
      citizenName,
      citizenPhone,
      disasterType: disasterType || 'FLOOD',
      severity: severity || 'MEDIUM',
      affectedCount: parseInt(affectedCount, 10) || 1,
      hasInjuries: Boolean(hasInjuries),
      floodWaterLevel: parseFloat(floodWaterLevel) || 0.0,
      vulnerability: vulnerability || {},
      description: description || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || 'Disaster Sector Coordinates',
      priorityScore: priorityResult.score,
      priorityLevel: priorityResult.priorityLevel,
      scoreBreakdown: priorityResult.breakdown,
      status: 'PENDING',
      isOfflineQueued: Boolean(isOfflineQueued)
    });

    await sos.save();

    // Emit Real-Time Socket.IO Notification to Command HQ
    emitEvent('sos:new', sos);

    // Create Audit Log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: citizenName,
      role: req.user ? req.user.role : 'CITIZEN',
      action: 'SOS_CREATED',
      entity: 'SOS',
      entityId: sos.sosId,
      details: `New ${sos.priorityLevel} priority SOS registered (${sos.affectedCount} victims, score: ${sos.priorityScore})`
    });

    res.status(201).json({
      success: true,
      message: 'Emergency SOS registered successfully. Help is being dispatched.',
      sos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all SOS requests with filters and sorting
// @route   GET /api/sos
// @access  Public / Private
const getAllSOS = async (req, res, next) => {
  try {
    const { status, severity, priorityLevel, disasterType, search, citizenId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (priorityLevel) filter.priorityLevel = priorityLevel;
    if (disasterType) filter.disasterType = disasterType;
    if (citizenId) filter.citizen = citizenId;

    if (search) {
      filter.$or = [
        { sosId: { $regex: search, $options: 'i' } },
        { citizenName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sosList = await SOS.find(filter)
      .populate('assignedTeam')
      .populate('citizen', 'name email phone')
      .sort({ priorityScore: -1, createdAt: -1 });

    res.json({
      success: true,
      count: sosList.length,
      sos: sosList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single SOS details
// @route   GET /api/sos/:id
// @access  Public / Private
const getSOSById = async (req, res, next) => {
  try {
    const sos = await SOS.findById(req.params.id)
      .populate('assignedTeam')
      .populate('citizen', 'name email phone');

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS record not found' });
    }

    res.json({
      success: true,
      sos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update SOS status or priority
// @route   PUT /api/sos/:id
// @access  Private (Command HQ / Rescue Team / Admin)
const updateSOS = async (req, res, next) => {
  try {
    const { status, severity, floodWaterLevel, description } = req.body;
    let sos = await SOS.findById(req.params.id);

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS record not found' });
    }

    if (status) {
      sos.status = status;
      if (status === 'RESOLVED') {
        sos.resolvedAt = new Date();
      }
    }

    if (severity) sos.severity = severity;
    if (floodWaterLevel !== undefined) sos.floodWaterLevel = parseFloat(floodWaterLevel);
    if (description !== undefined) sos.description = description;

    // Recalculate priority if severity or water level updated
    if (severity || floodWaterLevel !== undefined) {
      const priorityResult = calculatePriorityScore({
        severity: sos.severity,
        affectedCount: sos.affectedCount,
        hasInjuries: sos.hasInjuries,
        floodWaterLevel: sos.floodWaterLevel,
        vulnerability: sos.vulnerability,
        createdAt: sos.createdAt
      });
      sos.priorityScore = priorityResult.score;
      sos.priorityLevel = priorityResult.priorityLevel;
      sos.scoreBreakdown = priorityResult.breakdown;
    }

    await sos.save();

    // Real-time broadcast update
    emitEvent('sos:updated', sos);

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Command Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'SOS_UPDATED',
      entity: 'SOS',
      entityId: sos.sosId,
      details: `SOS status updated to ${sos.status} (score: ${sos.priorityScore})`
    });

    res.json({
      success: true,
      message: 'SOS updated successfully',
      sos
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete SOS
// @route   DELETE /api/sos/:id
// @access  Private (Admin / Command HQ)
const deleteSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findById(req.params.id);
    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS record not found' });
    }

    await SOS.findByIdAndDelete(req.params.id);

    emitEvent('sos:deleted', { id: req.params.id, sosId: sos.sosId });

    res.json({
      success: true,
      message: `SOS ${sos.sosId} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSOS,
  getAllSOS,
  getSOSById,
  updateSOS,
  deleteSOS
};
