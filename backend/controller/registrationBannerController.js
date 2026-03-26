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
    if (data.mobileBackgroundImage) data.mobileBackgroundImage = convertCloudUrlToStream(req, data.mobileBackgroundImage);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings (admin)
exports.updateSettings = async (req, res) => {
  try {
    const { backgroundImage, mobileBackgroundImage, quote } = req.body;
    let settings = await RegistrationBannerSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new RegistrationBannerSettings({ key: 'main' });
    }

    if (quote !== undefined) settings.quote = quote;

    // Handle desktop banner
    const bgFile = req.files && req.files['backgroundImageFile'] ? req.files['backgroundImageFile'][0] : null;
    if (bgFile && bgFile.location) {
      settings.backgroundImage = bgFile.location;
    } else if (backgroundImage !== undefined) {
      settings.backgroundImage = backgroundImage;
    }

    // Handle mobile banner
    const mobileBgFile = req.files && req.files['mobileBackgroundImageFile'] ? req.files['mobileBackgroundImageFile'][0] : null;
    if (mobileBgFile && mobileBgFile.location) {
      settings.mobileBackgroundImage = mobileBgFile.location;
    } else if (mobileBackgroundImage !== undefined) {
      settings.mobileBackgroundImage = mobileBackgroundImage;
    }

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
