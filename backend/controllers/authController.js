const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'rescuemesh_secure_jwt_secret_key_2026', {
    expiresIn: '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, address, latitude, longitude } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: role || 'CITIZEN',
      address: address || 'Disaster Zone Resident',
      latitude: latitude || 13.0827,
      longitude: longitude || 80.2500
    });

    const token = generateToken(user._id);

    // Audit log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      role: user.role,
      action: 'USER_REGISTERED',
      entity: 'USER',
      entityId: user._id.toString(),
      details: `User registered with role ${user.role}`
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your email.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user._id);

    // Audit log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user._id.toString(),
      details: `User logged in successfully`
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get demo credentials list
// @route   GET /api/auth/demo-accounts
// @access  Public
const getDemoAccounts = async (req, res) => {
  res.json({
    success: true,
    accounts: [
      { role: 'CITIZEN', email: 'citizen@rescuemesh.org', name: 'Ravi Kumar (Citizen / Victim)', password: 'Emergency123!' },
      { role: 'COMMAND_HQ', email: 'hq@rescuemesh.org', name: 'Commander Sarah Jenkins (HQ Operations)', password: 'Emergency123!' },
      { role: 'RESCUE_TEAM', email: 'rescue1@rescuemesh.org', name: 'Capt. Vikram Rao (Team Alpha Lead)', password: 'Emergency123!' },
      { role: 'HOSPITAL_MANAGER', email: 'hospital@rescuemesh.org', name: 'Dr. Anita Desai (Central Hospital Admin)', password: 'Emergency123!' },
      { role: 'SHELTER_MANAGER', email: 'shelter@rescuemesh.org', name: 'Karthik Menon (Metro Relief Director)', password: 'Emergency123!' },
      { role: 'ADMIN', email: 'admin@rescuemesh.org', name: 'Chief Admin David Vance', password: 'Emergency123!' }
    ]
  });
};

module.exports = {
  register,
  login,
  getMe,
  getDemoAccounts
};
