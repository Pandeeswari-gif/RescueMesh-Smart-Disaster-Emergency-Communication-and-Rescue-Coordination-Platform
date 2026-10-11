const express = require('express');
const router = express.Router();
const {
  getDisasters,
  createDisaster,
  updateDisaster,
  simulateSurge
} = require('../controllers/disasterController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDisasters);
router.post('/simulate-surge', simulateSurge);
router.post('/', protect, authorize('COMMAND_HQ', 'ADMIN'), createDisaster);
router.put('/:id', protect, authorize('COMMAND_HQ', 'ADMIN'), updateDisaster);

module.exports = router;
