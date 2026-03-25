const mongoose = require('mongoose');

const registrationBannerSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  backgroundImage: { type: String, default: '/auth-banner.png' },
  quote: { type: String, default: 'Where skill is the only selection criteria and your dream is the only qualification.' },
}, { timestamps: true });

module.exports = mongoose.model('RegistrationBannerSettings', registrationBannerSettingsSchema);
