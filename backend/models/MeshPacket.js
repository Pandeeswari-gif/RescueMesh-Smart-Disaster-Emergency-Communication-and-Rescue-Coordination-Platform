const mongoose = require('mongoose');

const meshPacketSchema = new mongoose.Schema({
  packetId: {
    type: String,
    required: true,
    unique: true
  },
  sourceNode: {
    nodeId: { type: String, required: true },
    nodeType: { type: String, enum: ['CITIZEN_PHONE', 'RELAY_NODE', 'RESCUE_VEHICLE', 'COMMAND_GATEWAY'], default: 'CITIZEN_PHONE' },
    label: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  destinationNode: {
    nodeId: { type: String, default: 'COMMAND_GATEWAY' },
    nodeType: { type: String, default: 'COMMAND_GATEWAY' },
    label: { type: String, default: 'Command HQ Tactical Gateway' },
    latitude: { type: Number, default: 13.0827 },
    longitude: { type: Number, default: 80.2300 }
  },
  payload: {
    type: { type: String, default: 'EMERGENCY_SOS' },
    victimName: { type: String, default: 'Stranded Citizen' },
    disasterType: { type: String, default: 'FLOOD' },
    severity: { type: String, default: 'CRITICAL' },
    affectedCount: { type: Number, default: 3 },
    message: { type: String, default: 'Off-grid SOS packet transmitted via P2P relay mesh' }
  },
  hops: [
    {
      fromNodeId: { type: String },
      toNodeId: { type: String },
      nodeType: { type: String },
      timestamp: { type: Date, default: Date.now },
      signalRssi: { type: Number, default: -65 }
    }
  ],
  hopCount: {
    type: Number,
    default: 0
  },
  maxTtl: {
    type: Number,
    default: 5
  },
  ttlRemaining: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ['CREATED', 'RELAYED', 'FORWARDED', 'DELIVERED', 'DROPPED_TTL'],
    default: 'CREATED'
  },
  duplicatePrevented: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MeshPacket', meshPacketSchema);
