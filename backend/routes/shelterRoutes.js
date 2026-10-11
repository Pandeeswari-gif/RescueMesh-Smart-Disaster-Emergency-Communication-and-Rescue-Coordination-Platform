const express = require('express');
const router = express.Router();
const { getShelters, createShelter, updateShelter } = require('../controllers/shelterController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getShelters);
router.post('/', protect, authorize('ADMIN'), createShelter);
router.put('/:id', protect, authorize('SHELTER_MANAGER', 'COMMAND_HQ', 'ADMIN'), updateShelter);

module.exports = router;
