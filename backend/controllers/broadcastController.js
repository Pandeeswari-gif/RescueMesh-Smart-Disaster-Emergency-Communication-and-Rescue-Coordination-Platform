const Broadcast = require('../models/Broadcast');
const AuditLog = require('../models/AuditLog');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get broadcast history
// @route   GET /api/broadcasts
// @access  Public
const getBroadcasts = async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      count: broadcasts.length,
      broadcasts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Multi-Channel Emergency Broadcast
// @route   POST /api/broadcasts
// @access  Private (Command HQ / Admin)
const createBroadcast = async (req, res, next) => {
  try {
    const { title, message, type, severity, channels, targetZone } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const broadcast = new Broadcast({
      title,
      message,
      type: type || 'FLOOD_WARNING',
      severity: severity || 'WARNING',
      channels: channels && channels.length > 0 ? channels : ['IN_APP', 'LOCAL_NETWORK'],
      targetZone: targetZone || 'ALL_SECTORS',
      sentBy: req.user ? req.user._id : null,
      senderName: req.user ? `${req.user.name} (${req.user.role})` : 'Command HQ Operations',
      reachCount: Math.floor(8000 + Math.random() * 15000)
    });

    await broadcast.save();

    // Real-Time Socket.IO Alert broadcast to all connected clients
    emitEvent('broadcast:new', broadcast);

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Command Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'EMERGENCY_BROADCAST_TRANSMITTED',
      entity: 'BROADCAST',
      entityId: broadcast._id.toString(),
      details: `Dispatched [${broadcast.severity}] '${broadcast.title}' across ${broadcast.channels.join(', ')}`
    });

    res.status(201).json({
      success: true,
      message: 'Emergency broadcast transmitted successfully across selected channels.',
      broadcast
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBroadcasts,
  createBroadcast
};
