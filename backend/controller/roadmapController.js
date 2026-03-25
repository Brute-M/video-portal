const RoadmapItem = require('../model/roadmapItem.model');
const RoadmapSettings = require('../model/roadmapSettings.model');
const { convertCloudUrlToStream } = require('../utils/cloudStore');

// GET active items (public)
exports.getItems = async (req, res) => {
  try {
    const items = await RoadmapItem.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    let settings = await RoadmapSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RoadmapSettings.create({ key: 'main' });
    }
    const settingsObj = settings.toObject();
    if (settingsObj.backgroundImage) settingsObj.backgroundImage = convertCloudUrlToStream(req, settingsObj.backgroundImage);
    res.status(200).json({ success: true, data: items, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all items (admin)
exports.getAllItems = async (req, res) => {
  try {
    const items = await RoadmapItem.find().sort({ order: 1, createdAt: -1 });
    let settings = await RoadmapSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RoadmapSettings.create({ key: 'main' });
    }
    const settingsObj = settings.toObject();
    if (settingsObj.backgroundImage) settingsObj.backgroundImage = convertCloudUrlToStream(req, settingsObj.backgroundImage);
    res.status(200).json({ success: true, data: items, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create item
exports.createItem = async (req, res) => {
  try {
    const { icon, headline, description, order, isActive } = req.body;

    if (!headline || !description) {
      return res.status(400).json({ success: false, message: 'Headline and Description are required' });
    }

    const item = new RoadmapItem({
      icon: icon || 'FileText',
      headline,
      description,
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

    const item = await RoadmapItem.findByIdAndUpdate(id, update, { new: true, runValidators: true });
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
    const item = await RoadmapItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await RoadmapSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RoadmapSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings
exports.updateSettings = async (req, res) => {
  try {
    const { titleBefore, titleHighlight, backgroundImage } = req.body;
    let settings = await RoadmapSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new RoadmapSettings({ key: 'main' });
    }

    if (titleBefore !== undefined) settings.titleBefore = titleBefore;
    if (titleHighlight !== undefined) settings.titleHighlight = titleHighlight;

    if (req.file && req.file.location) {
      settings.backgroundImage = req.file.location;
    } else if (backgroundImage !== undefined) {
      settings.backgroundImage = backgroundImage;
    }

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
