const RegistrationBannerSettings = require('../model/registrationBannerSettings.model');
const { convertCloudUrlToStream } = require('../utils/cloudStore');

// GET settings (public)
exports.getSettings = async (req, res) => {
  try {
    let settings = await RegistrationBannerSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationBannerSettings.create({ key: 'main' });
    }
    const data = settings.toObject();
    if (data.backgroundImage) data.backgroundImage = convertCloudUrlToStream(req, data.backgroundImage);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings (admin)
exports.updateSettings = async (req, res) => {
  try {
    const { backgroundImage, quote } = req.body;
    let settings = await RegistrationBannerSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new RegistrationBannerSettings({ key: 'main' });
    }

    if (quote !== undefined) settings.quote = quote;

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
