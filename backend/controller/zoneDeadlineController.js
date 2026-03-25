const ZoneDeadlineSettings = require('../model/zoneDeadlineSettings.model');

// GET settings (public)
exports.getSettings = async (req, res) => {
  try {
    let settings = await ZoneDeadlineSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await ZoneDeadlineSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings (admin)
exports.updateSettings = async (req, res) => {
  try {
    const {
      titleBefore, titleHighlight,
      stat1Value, stat1Label,
      stat2Label,
      stat3Value, stat3Label,
      ctaLine1, ctaLine2, buttonText, countdownTargetDate
    } = req.body;

    let settings = await ZoneDeadlineSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new ZoneDeadlineSettings({ key: 'main' });
    }

    if (titleBefore !== undefined) settings.titleBefore = titleBefore;
    if (titleHighlight !== undefined) settings.titleHighlight = titleHighlight;
    if (stat1Value !== undefined) settings.stat1Value = stat1Value;
    if (stat1Label !== undefined) settings.stat1Label = stat1Label;
    if (stat2Label !== undefined) settings.stat2Label = stat2Label;
    if (stat3Value !== undefined) settings.stat3Value = stat3Value;
    if (stat3Label !== undefined) settings.stat3Label = stat3Label;
    if (ctaLine1 !== undefined) settings.ctaLine1 = ctaLine1;
    if (ctaLine2 !== undefined) settings.ctaLine2 = ctaLine2;
    if (buttonText !== undefined) settings.buttonText = buttonText;
    if (countdownTargetDate !== undefined) settings.countdownTargetDate = new Date(countdownTargetDate);

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
