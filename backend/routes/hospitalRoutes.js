const express = require('express');
const router = express.Router();
const { getHospitals, createHospital, updateHospital } = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getHospitals);
router.post('/', protect, authorize('ADMIN'), createHospital);
router.put('/:id', protect, authorize('HOSPITAL_MANAGER', 'COMMAND_HQ', 'ADMIN'), updateHospital);

module.exports = router;
