const express = require('express');
const router = express.Router();
const {
  getResources,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getResources);
router.post('/', protect, authorize('COMMAND_HQ', 'ADMIN'), createResource);
router.put('/:id', protect, authorize('COMMAND_HQ', 'ADMIN'), updateResource);
router.delete('/:id', protect, authorize('COMMAND_HQ', 'ADMIN'), deleteResource);

module.exports = router;
