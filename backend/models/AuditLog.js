const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userName: {
    type: String,
    default: 'System Operator'
  },
  role: {
    type: String,
    default: 'SYSTEM'
  },
  action: {
    type: String,
    required: true // e.g. 'SOS_CREATED', 'TEAM_DISPATCHED', 'RESOURCE_ALLOCATED', 'BROADCAST_SENT'
  },
  entity: {
    type: String,
    required: true // e.g. 'SOS', 'RESCUE_TEAM', 'RESOURCE', 'HOSPITAL', 'SHELTER', 'BROADCAST'
  },
  entityId: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
