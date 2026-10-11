const express = require('express');
const router = express.Router();
const { getAnalytics, getUsers, updateUser, getAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/analytics', protect, authorize('COMMAND_HQ', 'ADMIN'), getAnalytics);
router.get('/users', protect, authorize('ADMIN'), getUsers);
router.put('/users/:id', protect, authorize('ADMIN'), updateUser);
router.get('/audit', protect, authorize('COMMAND_HQ', 'ADMIN'), getAuditLogs);

module.exports = router;
