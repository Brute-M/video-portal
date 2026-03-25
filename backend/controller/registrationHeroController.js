const RegistrationHeroSettings = require('../model/registrationHeroSettings.model');
const { convertCloudUrlToStream } = require('../utils/cloudStore');

// GET settings (public)
exports.getSettings = async (req, res) => {
  try {
    let settings = await RegistrationHeroSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationHeroSettings.create({ key: 'main' });
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
    const { titleLine1, titleLine2, subtitle, buttonText, paymentNote, backgroundImage } = req.body;
    let settings = await RegistrationHeroSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new RegistrationHeroSettings({ key: 'main' });
    }

    if (titleLine1 !== undefined) settings.titleLine1 = titleLine1;
    if (titleLine2 !== undefined) settings.titleLine2 = titleLine2;
    if (subtitle !== undefined) settings.subtitle = subtitle;
    if (buttonText !== undefined) settings.buttonText = buttonText;
    if (paymentNote !== undefined) settings.paymentNote = paymentNote;

    // File upload via cloudStorageUploader
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
