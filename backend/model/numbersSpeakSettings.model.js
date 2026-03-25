const mongoose = require('mongoose');

const numbersSpeakSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  title: { type: String, default: 'The Numbers Speak' }
}, { timestamps: true });

module.exports = mongoose.model('NumbersSpeakSettings', numbersSpeakSettingsSchema);
