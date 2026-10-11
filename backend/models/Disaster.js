const mongoose = require('mongoose');

const disasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Disaster event name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['FLOOD', 'EARTHQUAKE', 'CYCLONE', 'LANDSLIDE', 'FIRE', 'INDUSTRIAL'],
    default: 'FLOOD'
  },
  severity: {
    type: String,
    enum: ['MODERATE', 'HIGH', 'SEVERE', 'CATASTROPHIC'],
    default: 'SEVERE'
  },
  epicenter: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationName: { type: String, default: 'Central River Delta' }
  },
  radiusKm: {
    type: Number,
    default: 15.0
  },
  waterSurgeLevel: {
    type: Number,
    min: 0.0,
    max: 3.0,
    default: 1.2
  },
  active: {
    type: Boolean,
    default: true
  },
  affectedPopulationEstimate: {
    type: Number,
    default: 180000
  },
  declaredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Disaster', disasterSchema);
