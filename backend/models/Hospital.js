const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  icuBedsTotal: {
    type: Number,
    required: true,
    default: 20
  },
  icuBedsAvailable: {
    type: Number,
    required: true,
    default: 5
  },
  generalBedsTotal: {
    type: Number,
    required: true,
    default: 100
  },
  generalBedsAvailable: {
    type: Number,
    required: true,
    default: 25
  },
  emergencyBedsTotal: {
    type: Number,
    required: true,
    default: 30
  },
  emergencyBedsAvailable: {
    type: Number,
    required: true,
    default: 10
  },
  oxygenCylindersAvailable: {
    type: Number,
    default: 50
  },
  ambulancesAvailable: {
    type: Number,
    default: 4
  },
  phone: {
    type: String,
    required: true
  },
  elevation: {
    type: Number,
    default: 12.0
  },
  floodRiskThreshold: {
    type: Number,
    default: 2.5
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);
