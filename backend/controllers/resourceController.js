const Resource = require('../models/Resource');
const AuditLog = require('../models/AuditLog');
const { emitEvent } = require('../sockets/socketHandler');

// @desc    Get all resources with filters
// @route   GET /api/resources
// @access  Public / Private
const getResources = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.depotName': { $regex: search, $options: 'i' } }
      ];
    }

    const resources = await Resource.find(filter).sort({ type: 1, name: 1 });
    res.json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new emergency resource
// @route   POST /api/resources
// @access  Private (Command HQ / Admin)
const createResource = async (req, res, next) => {
  try {
    const resource = new Resource({
      ...req.body,
      lastUpdatedBy: req.user ? req.user._id : null
    });
    await resource.save();

    emitEvent('resource:updated', resource);

    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Logistics Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'RESOURCE_CREATED',
      entity: 'RESOURCE',
      entityId: resource._id.toString(),
      details: `Added new resource: ${resource.name} (${resource.quantity} ${resource.unit})`
    });

    res.status(201).json({ success: true, resource });
  } catch (error) {
    next(error);
  }
};

// @desc    Update resource or change allocation
// @route   PUT /api/resources/:id
// @access  Private (Command HQ / Admin)
const updateResource = async (req, res, next) => {
  try {
    let resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const { name, type, quantity, unit, status, allocatedTo, location } = req.body;

    if (name !== undefined) resource.name = name;
    if (type !== undefined) resource.type = type;
    if (quantity !== undefined) resource.quantity = quantity;
    if (unit !== undefined) resource.unit = unit;
    if (status !== undefined) resource.status = status;
    if (allocatedTo !== undefined) resource.allocatedTo = allocatedTo;
    if (location !== undefined) resource.location = location;
    resource.lastUpdatedBy = req.user ? req.user._id : null;

    if (resource.quantity <= 0) {
      resource.status = 'DEPLETED';
    }

    await resource.save();

    emitEvent('resource:updated', resource);

    await AuditLog.create({
      user: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Logistics Officer',
      role: req.user ? req.user.role : 'COMMAND_HQ',
      action: 'RESOURCE_UPDATED',
      entity: 'RESOURCE',
      entityId: resource._id.toString(),
      details: `Updated ${resource.name}: quantity ${resource.quantity} (${resource.status})`
    });

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Admin / Command HQ)
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    await Resource.findByIdAndDelete(req.params.id);

    emitEvent('resource:deleted', { id: req.params.id });

    res.json({
      success: true,
      message: 'Resource removed from inventory'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResources,
  createResource,
  updateResource,
  deleteResource
};
