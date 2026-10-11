const Hospital = require('../models/Hospital');
const AuditLog = require('../models/AuditLog');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find().populate('manager', 'name email phone');
    res.json({
      success: true,
      count: hospitals.length,
      hospitals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private (Admin)
const createHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.create(req.body);
    emitEvent('hospital:updated', hospital);
    res.status(201).json({ success: true, hospital });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital bed capacities, oxygen, or ambulances
// @route   PUT /api/hospitals/:id
// @access  Private (Hospital Manager / Command HQ / Admin)
const updateHospital = async (req, res, next) => {
  try {
    let hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Real-time broadcast
    emitEvent('hospital:updated', hospital);

    // Audit log
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Hospital Admin',
      role: req.user ? req.user.role : 'HOSPITAL_MANAGER',
      action: 'HOSPITAL_CAPACITY_UPDATED',
      entity: 'HOSPITAL',
      entityId: hospital._id.toString(),
      details: `${hospital.name} availability updated: ICU ${hospital.icuBedsAvailable}/${hospital.icuBedsTotal}, General ${hospital.generalBedsAvailable}/${hospital.generalBedsTotal}, Ambulances ${hospital.ambulancesAvailable}`
    });

    res.json({
      success: true,
      message: 'Hospital records updated successfully',
      hospital
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitals,
  createHospital,
  updateHospital
};
