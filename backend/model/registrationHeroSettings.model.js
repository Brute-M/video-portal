const mongoose = require('mongoose');

const registrationHeroSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  titleLine1: { type: String, default: "Don\u2019t Let Your Talent" },
  titleLine2: { type: String, default: 'Stay in the Gully.' },
  subtitle: { type: String, default: 'Slots for your city are filling fast. Join the revolution today.' },
  buttonText: { type: String, default: 'REGISTER NOW - \u20B91499' },
  paymentNote: { type: String, default: 'Secure Payment via UPI/Card' },
  backgroundImage: { type: String, default: '/banner.png' },
}, { timestamps: true });

module.exports = mongoose.model('RegistrationHeroSettings', registrationHeroSettingsSchema);
