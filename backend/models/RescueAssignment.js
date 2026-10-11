const mongoose = require('mongoose');

const rescueAssignmentSchema = new mongoose.Schema({
  sos: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOS',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RescueTeam',
    required: true
  },
  dispatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dispatchedAt: {
    type: Date,
    default: Date.now
  },
  routeCoordinates: [
    {
      type: [Number] // [lng, lat]
    }
  ],
  avoidedHazards: [
    { type: String }
  ],
  estimatedDistanceKm: {
    type: Number,
    default: 0
  },
  estimatedTimeMin: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['DISPATCHED', 'ON_ROUTE', 'ON_SITE', 'RESCUING', 'COMPLETED', 'ABORTED'],
    default: 'DISPATCHED'
  },
  statusTimeline: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: '' }
    }
  ],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RescueAssignment', rescueAssignmentSchema);
