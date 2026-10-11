const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  sosId: {
    type: String,
    required: true,
    unique: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  citizenName: {
    type: String,
    required: [true, 'Victim/Reporter name is required']
  },
  citizenPhone: {
    type: String,
    required: [true, 'Contact phone is required']
  },
  disasterType: {
    type: String,
    enum: ['FLOOD', 'EARTHQUAKE', 'CYCLONE', 'LANDSLIDE', 'FIRE', 'MEDICAL', 'BUILDING_COLLAPSE', 'OTHER'],
    default: 'FLOOD'
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  affectedCount: {
    type: Number,
    required: [true, 'Number of people affected is required'],
    min: 1,
    default: 1
  },
  hasInjuries: {
    type: Boolean,
    default: false
  },
  floodWaterLevel: {
    type: Number,
    default: 0.0
  },
  vulnerability: {
    hasElderly: { type: Boolean, default: false },
    hasInfants: { type: Boolean, default: false },
    hasDisabled: { type: Boolean, default: false },
    hasPregnant: { type: Boolean, default: false }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  },
  address: {
    type: String,
    default: 'GPS Coordinates Provided'
  },
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 25
  },
  priorityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  scoreBreakdown: [
    {
      factor: { type: String },
      points: { type: Number },
      reason: { type: String }
    }
  ],
  status: {
    type: String,
    enum: ['PENDING', 'DISPATCHED', 'ON_ROUTE', 'ON_SITE', 'RESCUING', 'RESOLVED', 'CANCELLED'],
    default: 'PENDING'
  },
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RescueTeam',
    default: null
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  isOfflineQueued: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SOS', sosSchema);
