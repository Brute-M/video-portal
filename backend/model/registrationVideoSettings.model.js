const mongoose = require('mongoose');

const registrationVideoSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  titleBefore: { type: String, default: 'Latest' },
  titleHighlight: { type: String, default: 'Videos' }
}, { timestamps: true });

module.exports = mongoose.model('RegistrationVideoSettings', registrationVideoSettingsSchema);
