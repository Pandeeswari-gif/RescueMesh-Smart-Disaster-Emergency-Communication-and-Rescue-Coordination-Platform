const express = require('express');
const router = express.Router();
const {
  getDrones,
  triggerDroneScan,
  convertDetectionToSOS,
  updateDrone
} = require('../controllers/droneController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDrones);
router.post('/detect', triggerDroneScan);
router.post('/detection/:id/convert-to-sos', protect, authorize('COMMAND_HQ', 'ADMIN'), convertDetectionToSOS);
router.put('/:id', protect, authorize('COMMAND_HQ', 'ADMIN'), updateDrone);

module.exports = router;
