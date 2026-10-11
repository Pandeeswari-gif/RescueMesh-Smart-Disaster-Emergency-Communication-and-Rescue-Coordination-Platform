const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  droneId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  model: {
    type: String,
    default: 'Matrice 300 RTK - FLIR Boson Dual Thermal'
  },
  status: {
    type: String,
    enum: ['IDLE', 'PATROLLING', 'SCANNING', 'RETURNING', 'CHARGING'],
    default: 'PATROLLING'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 88
  },
  currentSector: {
    type: String,
    default: 'SECTOR-B2'
  },
  latitude: {
    type: Number,
    default: 13.0850
  },
  longitude: {
    type: Number,
    default: 80.2520
  },
  altitudeM: {
    type: Number,
    default: 85
  },
  flirSensorActive: {
    type: Boolean,
    default: true
  },
  scanCoveragePercent: {
    type: Number,
    default: 42
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drone', droneSchema);
