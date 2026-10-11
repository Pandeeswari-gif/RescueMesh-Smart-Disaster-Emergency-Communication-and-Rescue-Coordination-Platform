const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shelter name is required'],
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
  totalCapacity: {
    type: Number,
    required: [true, 'Total capacity is required'],
    min: 10,
    default: 500
  },
  currentOccupancy: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  foodStockDays: {
    type: Number,
    default: 5
  },
  waterStockDays: {
    type: Number,
    default: 5
  },
  medicalSupport: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'FULL', 'CLOSED'],
    default: 'OPEN'
  },
  elevation: {
    type: Number,
    default: 15.0
  },
  floodRiskThreshold: {
    type: Number,
    default: 2.0
  },
  phone: {
    type: String,
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available capacity
shelterSchema.virtual('availableCapacity').get(function() {
  return Math.max(0, this.totalCapacity - this.currentOccupancy);
});

// Virtual for occupancy percentage
shelterSchema.virtual('occupancyPercentage').get(function() {
  if (this.totalCapacity === 0) return 0;
  return Math.min(100, Math.round((this.currentOccupancy / this.totalCapacity) * 100));
});

module.exports = mongoose.model('Shelter', shelterSchema);
