const express = require('express');
const router = express.Router();
const { getBroadcasts, createBroadcast } = require('../controllers/broadcastController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBroadcasts);
router.post('/', protect, authorize('COMMAND_HQ', 'ADMIN'), createBroadcast);

module.exports = router;
