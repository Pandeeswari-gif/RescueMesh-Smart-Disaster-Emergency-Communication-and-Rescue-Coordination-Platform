const mongoose = require('mongoose');

const hazardZoneSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  disasterType: {
    type: String,
    default: 'FLOOD'
  },
  polygonCoordinates: [
    {
      type: [Number] // [lng, lat]
    }
  ],
  baseRiskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH'
  },
  criticalSurgeThreshold: {
    type: Number,
    default: 1.2
  },
  isBlockedRoad: {
    type: Boolean,
    default: false
  },
  affectedSectors: [
    { type: String }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('HazardZone', hazardZoneSchema);
