const NumbersSpeakItem = require('../model/numbersSpeakItem.model');
const NumbersSpeakSettings = require('../model/numbersSpeakSettings.model');

// GET active items (public)
exports.getItems = async (req, res) => {
  try {
    const items = await NumbersSpeakItem.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    let settings = await NumbersSpeakSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await NumbersSpeakSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: items, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all items (admin)
exports.getAllItems = async (req, res) => {
  try {
    const items = await NumbersSpeakItem.find().sort({ order: 1, createdAt: -1 });
    let settings = await NumbersSpeakSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await NumbersSpeakSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: items, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create item
exports.createItem = async (req, res) => {
  try {
    const { icon, hook, descriptor, order, isActive } = req.body;

    if (!hook || !descriptor) {
      return res.status(400).json({ success: false, message: 'Hook text and Descriptor are required' });
    }

    const item = new NumbersSpeakItem({
      icon: icon || 'Trophy',
      hook,
      descriptor,
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== 'false' && isActive !== false
    });
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    if (update.order !== undefined) update.order = Number(update.order);
    if (update.isActive !== undefined) update.isActive = update.isActive !== 'false' && update.isActive !== false;

    const item = await NumbersSpeakItem.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await NumbersSpeakItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await NumbersSpeakSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await NumbersSpeakSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings
exports.updateSettings = async (req, res) => {
  try {
    const { title } = req.body;
    let settings = await NumbersSpeakSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new NumbersSpeakSettings({ key: 'main' });
    }

    if (title !== undefined) settings.title = title;

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
