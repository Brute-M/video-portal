const RegistrationVideo = require('../model/registrationVideo.model');
const RegistrationVideoSettings = require('../model/registrationVideoSettings.model');
const { convertCloudUrlToStream } = require('../utils/cloudStore');

// GET all videos (public - only active)
exports.getVideos = async (req, res) => {
  try {
    const videos = await RegistrationVideo.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    let settings = await RegistrationVideoSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationVideoSettings.create({ key: 'main' });
    }

        if (videos.length) {
      videos.forEach(item => {
        if (item.thumbnail) {
          item.thumbnail = convertCloudUrlToStream(req, item.thumbnail)
        }
      })
    }
    res.status(200).json({ success: true, data: videos, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all videos (admin - all including inactive)
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await RegistrationVideo.find().sort({ order: 1, createdAt: -1 });
    let settings = await RegistrationVideoSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationVideoSettings.create({ key: 'main' });
    }

    if (videos.length) {
      videos.forEach(item => {
        if (item.thumbnail) {
          item.thumbnail = convertCloudUrlToStream(req, item.thumbnail)
        }
      })
    }
    res.status(200).json({ success: true, data: videos, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create
exports.createVideo = async (req, res) => {
  try {
    let { title, thumbnail, duration, videoSrc, order, isActive } = req.body;

    // If a file was uploaded (via cloudStorageUploader middleware), use its URL as thumbnail
    if (req.file && req.file.location) {
      thumbnail = req.file.location;
    }

    if (!thumbnail || !videoSrc) {
      return res.status(400).json({ success: false, message: 'Thumbnail (image or URL) and Video URL are required' });
    }

    const video = new RegistrationVideo({
      title,
      thumbnail,
      duration,
      videoSrc,
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== 'false' && isActive !== false
    });
    await video.save();
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    // If a file was uploaded, override thumbnail with the new uploaded URL
    if (req.file && req.file.location) {
      update.thumbnail = req.file.location;
    }

    if (update.order !== undefined) update.order = Number(update.order);
    if (update.isActive !== undefined) update.isActive = update.isActive !== 'false' && update.isActive !== false;

    const video = await RegistrationVideo.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.status(200).json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await RegistrationVideo.findByIdAndDelete(id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET settings (admin)
exports.getSettings = async (req, res) => {
  try {
    let settings = await RegistrationVideoSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationVideoSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE settings (admin)
exports.updateSettings = async (req, res) => {
  try {
    const { titleBefore, titleHighlight } = req.body;
    let settings = await RegistrationVideoSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new RegistrationVideoSettings({ key: 'main' });
    }
    
    if (titleBefore !== undefined) settings.titleBefore = titleBefore;
    if (titleHighlight !== undefined) settings.titleHighlight = titleHighlight;
    
    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
