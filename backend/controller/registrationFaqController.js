const RegistrationFaq = require('../model/registrationFaq.model');
const RegistrationFaqSettings = require('../model/registrationFaqSettings.model');

// GET active FAQs (public)
exports.getFaqs = async (req, res) => {
  try {
    const faqs = await RegistrationFaq.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    let settings = await RegistrationFaqSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationFaqSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: faqs, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all FAQs (admin)
exports.getAllFaqs = async (req, res) => {
  try {
    const faqs = await RegistrationFaq.find().sort({ order: 1, createdAt: -1 });
    let settings = await RegistrationFaqSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationFaqSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: faqs, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create FAQ
exports.createFaq = async (req, res) => {
  try {
    const { question, answer, order, isActive } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and Answer are required' });
    }

    const faq = new RegistrationFaq({
      question, answer,
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== 'false' && isActive !== false
    });
    await faq.save();
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update FAQ
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    if (update.order !== undefined) update.order = Number(update.order);
    if (update.isActive !== undefined) update.isActive = update.isActive !== 'false' && update.isActive !== false;

    const faq = await RegistrationFaq.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE FAQ
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await RegistrationFaq.findByIdAndDelete(id);
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await RegistrationFaqSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = await RegistrationFaqSettings.create({ key: 'main' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update settings
exports.updateSettings = async (req, res) => {
  try {
    const { titleBefore, titleHighlight } = req.body;
    let settings = await RegistrationFaqSettings.findOne({ key: 'main' });
    if (!settings) {
      settings = new RegistrationFaqSettings({ key: 'main' });
    }

    if (titleBefore !== undefined) settings.titleBefore = titleBefore;
    if (titleHighlight !== undefined) settings.titleHighlight = titleHighlight;

    await settings.save();
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
