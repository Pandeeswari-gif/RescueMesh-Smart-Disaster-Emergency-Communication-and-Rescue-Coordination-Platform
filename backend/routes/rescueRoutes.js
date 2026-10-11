const express = require('express');
const router = express.Router();
const {
  getRescueTeams,
  dispatchRescueTeam,
  updateRescueAssignmentStatus,
  getSafeRoute,
  getMyAssignment
} = require('../controllers/rescueController');
const { protect, authorize } = require('../middleware/auth');

router.get('/rescue-teams', getRescueTeams);
router.post('/rescue-assignments', protect, authorize('COMMAND_HQ', 'ADMIN'), dispatchRescueTeam);
router.put('/rescue-assignments/:id', protect, updateRescueAssignmentStatus);
router.post('/rescue/safe-route', getSafeRoute);
router.get('/rescue/my-assignment', protect, getMyAssignment);

module.exports = router;
