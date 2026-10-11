const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Broadcast title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Broadcast message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['FLOOD_WARNING', 'EVACUATION', 'SHELTER_INFO', 'ROAD_CLOSURE', 'MEDICAL_EMERGENCY', 'GENERAL_EMERGENCY'],
    default: 'FLOOD_WARNING'
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL', 'EVACUATE_NOW'],
    default: 'WARNING'
  },
  channels: [
    {
      type: String,
      enum: ['IN_APP', 'LOCAL_NETWORK', 'SMS_SIMULATION', 'RADIO_SIMULATION', 'MESH_BROADCAST']
    }
  ],
  targetZone: {
    type: String,
    default: 'ALL_SECTORS'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    default: 'Command HQ Operations'
  },
  reachCount: {
    type: Number,
    default: 12500 // simulated audience reach
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Broadcast', broadcastSchema);
