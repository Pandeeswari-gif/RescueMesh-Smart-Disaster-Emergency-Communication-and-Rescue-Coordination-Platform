const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'AMBULANCE',
      'RESCUE_BOAT',
      'RESCUE_VEHICLE',
      'MEDICAL_KIT',
      'FOOD_RATIONS',
      'DRINKING_WATER',
      'BLANKET',
      'OXYGEN_CYLINDER',
      'GENERATOR',
      'LIFE_JACKET',
      'OTHER'
    ],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'units'
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    depotName: { type: String, default: 'Central Logistics Depot' }
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'ALLOCATED', 'IN_TRANSIT', 'DEPLETED', 'MAINTENANCE'],
    default: 'AVAILABLE'
  },
  allocatedTo: {
    entityType: { type: String, enum: ['SHELTER', 'HOSPITAL', 'RESCUE_TEAM', 'CITIZEN', 'NONE'], default: 'NONE' },
    entityId: { type: String, default: null },
    entityName: { type: String, default: null }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);
