const PlayerStory = require('../model/playerStory.model');
const PlayerStorySettings = require('../model/playerStorySettings.model');
const { convertCloudUrlToStream } = require('../utils/cloudStore');

// GET active stories (public)
exports.getStories = async (req, res) => {
  try {
    const stories = await PlayerStory.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    let settings = await PlayerStorySettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await PlayerStorySettings.create({ key: 'main' });
    }
    const settingsObj = settings.toObject();
    if (settingsObj.backgroundImage) settingsObj.backgroundImage = convertCloudUrlToStream(req, settingsObj.backgroundImage);
    res.status(200).json({ success: true, data: stories, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all stories (admin)
exports.getAllStories = async (req, res) => {
  try {
    const stories = await PlayerStory.find().sort({ order: 1, createdAt: -1 });
    let settings = await PlayerStorySettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await PlayerStorySettings.create({ key: 'main' });
    }
    const settingsObj = settings.toObject();
    if (settingsObj.backgroundImage) settingsObj.backgroundImage = convertCloudUrlToStream(req, settingsObj.backgroundImage);
    res.status(200).json({ success: true, data: stories, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create story
exports.createStory = async (req, res) => {
  try {
    const { quote, name, role, highlight, order, isActive } = req.body;

    if (!quote || !name || !role) {
      return res.status(400).json({ success: false, message: 'Quote, Name, and Role are required' });
    }

    const story = new PlayerStory({
      quote, name, role,
      highlight: highlight || '',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== 'false' && isActive !== false
    });
    await story.save();
    res.status(201).json({ success: true, data: story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update story
exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    if (update.order !== undefined) update.order = Number(update.order);
    if (update.isActive !== undefined) update.isActive = update.isActive !== 'false' && update.isActive !== false;

    const story = await PlayerStory.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    res.status(200).json({ success: true, data: story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE story
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await PlayerStory.findByIdAndDelete(id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await PlayerStorySettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await PlayerStorySettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings
exports.updateSettings = async (req, res) => {
  try {
    const { badgeText, titleBefore, titleHighlight, subtitle, backgroundImage } = req.body;
    let settings = await PlayerStorySettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new PlayerStorySettings({ key: 'main' });
    }

    if (badgeText !== undefined) settings.badgeText = badgeText;
    if (titleBefore !== undefined) settings.titleBefore = titleBefore;
    if (titleHighlight !== undefined) settings.titleHighlight = titleHighlight;
    if (subtitle !== undefined) settings.subtitle = subtitle;

    // If a file was uploaded via cloudStorageUploader
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
