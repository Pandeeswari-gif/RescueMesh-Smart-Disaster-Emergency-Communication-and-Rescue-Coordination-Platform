const mongoose = require('mongoose');

const rescueTeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rescue team name is required'],
    trim: true
  },
  leaderName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'DISPATCHED', 'ON_ROUTE', 'ON_SITE', 'RESCUING', 'COMPLETED', 'OFFLINE'],
    default: 'AVAILABLE'
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  membersCount: {
    type: Number,
    default: 5
  },
  vehicleType: {
    type: String,
    enum: ['Zodiac Rescue Boat', 'Amphibious 8x8 Vehicle', 'Emergency All-Terrain Van', 'Tactical Drone Carrier', 'Rapid Response 4x4'],
    default: 'Emergency All-Terrain Van'
  },
  equipment: [
    { type: String }
  ],
  capacity: {
    type: Number,
    default: 8 // victims capacity per run
  },
  baseStation: {
    type: String,
    default: 'Central Command Base'
  },
  accountUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  activeSos: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOS',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RescueTeam', rescueTeamSchema);
