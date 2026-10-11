const express = require('express');
const router = express.Router();
const {
  createSOS,
  getAllSOS,
  getSOSById,
  updateSOS,
  deleteSOS
} = require('../controllers/sosController');
const { protect, authorize } = require('../middleware/auth');

// Optional auth for creation (citizens can submit anonymously or authenticated)
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, createSOS);

router.get('/', getAllSOS);
router.get('/:id', getSOSById);
router.put('/:id', protect, updateSOS);
router.delete('/:id', protect, authorize('COMMAND_HQ', 'ADMIN'), deleteSOS);

module.exports = router;
