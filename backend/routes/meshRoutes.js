const express = require('express');
const router = express.Router();
const { getMeshPackets, createMeshPacket, stepPacket } = require('../controllers/meshController');

router.get('/packets', getMeshPackets);
router.post('/packet', createMeshPacket);
router.post('/packet/:id/step', stepPacket);

module.exports = router;
