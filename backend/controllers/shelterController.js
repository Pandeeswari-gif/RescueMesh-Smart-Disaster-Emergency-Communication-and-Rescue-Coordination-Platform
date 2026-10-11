const Shelter = require('../models/Shelter');
const AuditLog = require('../models/AuditLog');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get all shelters
// @route   GET /api/shelters
// @access  Public
const getShelters = async (req, res, next) => {
  try {
    const shelters = await Shelter.find().populate('manager', 'name email phone');
    res.json({
      success: true,
      count: shelters.length,
      shelters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new shelter
// @route   POST /api/shelters
// @access  Private (Admin)
const createShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.create(req.body);
    emitEvent('shelter:updated', shelter);
    res.status(201).json({ success: true, shelter });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shelter occupancy, supplies, status
// @route   PUT /api/shelters/:id
// @access  Private (Shelter Manager / Command HQ / Admin)
const updateShelter = async (req, res, next) => {
  try {
    let shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Shelter not found' });
    }

    const { currentOccupancy, totalCapacity, foodStockDays, waterStockDays, medicalSupport, status } = req.body;

    if (currentOccupancy !== undefined) shelter.currentOccupancy = Math.max(0, parseInt(currentOccupancy, 10));
    if (totalCapacity !== undefined) shelter.totalCapacity = Math.max(1, parseInt(totalCapacity, 10));
    if (foodStockDays !== undefined) shelter.foodStockDays = parseFloat(foodStockDays);
    if (waterStockDays !== undefined) shelter.waterStockDays = parseFloat(waterStockDays);
    if (medicalSupport !== undefined) shelter.medicalSupport = Boolean(medicalSupport);
    if (status !== undefined) shelter.status = status;

    // Automatic status adjustment based on occupancy
    if (shelter.currentOccupancy >= shelter.totalCapacity) {
      shelter.status = 'FULL';
    } else if (shelter.status === 'FULL' && shelter.currentOccupancy < shelter.totalCapacity) {
      shelter.status = 'OPEN';
    }

    await shelter.save();

    emitEvent('shelter:updated', shelter);

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Shelter Director',
      role: req.user ? req.user.role : 'SHELTER_MANAGER',
      action: 'SHELTER_OCCUPANCY_UPDATED',
      entity: 'SHELTER',
      entityId: shelter._id.toString(),
      details: `${shelter.name} occupancy updated: ${shelter.currentOccupancy}/${shelter.totalCapacity} (${shelter.availableCapacity} beds open, ${shelter.occupancyPercentage}%)`
    });

    res.json({
      success: true,
      message: 'Shelter data updated successfully',
      shelter
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShelters,
  createShelter,
  updateShelter
};
