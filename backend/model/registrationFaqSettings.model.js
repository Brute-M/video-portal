const mongoose = require('mongoose');

const registrationFaqSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  titleBefore: { type: String, default: 'FREQUENTLY ASKED' },
  titleHighlight: { type: String, default: 'QUESTIONS' },
}, { timestamps: true });

module.exports = mongoose.model('RegistrationFaqSettings', registrationFaqSettingsSchema);
