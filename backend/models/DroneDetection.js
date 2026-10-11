const mongoose = require('mongoose');

const droneDetectionSchema = new mongoose.Schema({
  detectionId: {
    type: String,
    required: true,
    unique: true
  },
  droneId: {
    type: String,
    required: true
  },
  droneName: {
    type: String,
    default: 'Talon-1 Recon UAV'
  },
  sector: {
    type: String,
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  heatSignatureTempC: {
    type: Number,
    default: 36.9
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 92
  },
  estimatedVictims: {
    type: Number,
    default: 2
  },
  status: {
    type: String,
    enum: ['DETECTED', 'VERIFIED', 'CONVERTED_TO_SOS', 'DISMISSED'],
    default: 'DETECTED'
  },
  createdSosId: {
    type: String,
    default: null
  },
  detectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DroneDetection', droneDetectionSchema);
