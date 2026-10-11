const MeshPacket = require('../models/MeshPacket');
const SOS = require('../models/SOS');
const AuditLog = require('../models/AuditLog');
const { MESH_NODES, generateSimulatedMeshPacket, stepMeshPacketForward } = require('../services/meshSimulator');
const { calculatePriorityScore } = require('../services/priorityEngine');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get all mesh nodes and packets
// @route   GET /api/mesh/packets
// @access  Public / Private
const getMeshPackets = async (req, res, next) => {
  try {
    const packets = await MeshPacket.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      nodes: MESH_NODES,
      count: packets.length,
      packets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new simulated off-grid P2P mesh packet
// @route   POST /api/mesh/packet
// @access  Public / Private
const createMeshPacket = async (req, res, next) => {
  try {
    const { sourceNodeId, payload } = req.body;

    const { packet, plannedPath } = await generateSimulatedMeshPacket(sourceNodeId, payload);

    emitEvent('mesh:packet_created', { packet, plannedPath });

    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Mesh Node Agent',
      role: 'SYSTEM',
      action: 'MESH_PACKET_ORIGINATED',
      entity: 'MESH_PACKET',
      entityId: packet.packetId,
      details: `Generated off-grid packet ${packet.packetId} at ${packet.sourceNode.label} (TTL: ${packet.maxTtl})`
    });

    res.status(201).json({
      success: true,
      message: 'Simulated P2P Mesh packet created and injected into ad-hoc relay buffer.',
      packet,
      plannedPath
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Step packet forward to next mesh hop
// @route   POST /api/mesh/packet/:id/step
// @access  Public / Private
const stepPacket = async (req, res, next) => {
  try {
    const { packet, completed } = await stepMeshPacketForward(req.params.id);

    emitEvent('mesh:packet_relayed', { packet, completed });

    // If packet just delivered at Command Gateway, automatically register an SOS if flagged
    if (completed && packet.status === 'DELIVERED' && packet.payload && packet.payload.type === 'OFF_GRID_EMERGENCY_SOS') {
      const priority = calculatePriorityScore({
        severity: packet.payload.severity || 'CRITICAL',
        affectedCount: packet.payload.affectedCount || 3,
        hasInjuries: true,
        floodWaterLevel: 1.8
      });

      const sosId = `SOS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const autoSos = new SOS({
        sosId,
        citizenName: `${packet.payload.victimName} (Mesh P2P Relay)`,
        citizenPhone: 'OFF-GRID-MESH-RELAY',
        disasterType: packet.payload.disasterType || 'FLOOD',
        severity: packet.payload.severity || 'CRITICAL',
        affectedCount: packet.payload.affectedCount || 3,
        hasInjuries: true,
        floodWaterLevel: 1.8,
        description: `[OFF-GRID MESH PACKET ${packet.packetId}] ${packet.payload.message} - Relayed via ${packet.hopCount} mesh hops.`,
        latitude: packet.sourceNode.latitude,
        longitude: packet.sourceNode.longitude,
        address: `Transmitted via ${packet.sourceNode.label}`,
        priorityScore: priority.score,
        priorityLevel: priority.priorityLevel,
        scoreBreakdown: priority.breakdown,
        status: 'PENDING',
        isOfflineQueued: true
      });

      await autoSos.save();
      emitEvent('sos:new', autoSos);
    }

    res.json({
      success: true,
      packet,
      completed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeshPackets,
  createMeshPacket,
  stepPacket
};
