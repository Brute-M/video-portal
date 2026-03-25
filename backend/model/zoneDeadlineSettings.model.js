const mongoose = require('mongoose');

const zoneDeadlineSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  titleBefore: { type: String, default: 'ZONES ARE' },
  titleHighlight: { type: String, default: 'NEARING CAPACITY' },
  stat1Value: { type: String, default: '78%' },
  stat1Label: { type: String, default: 'Registrations Completed' },
  stat2Label: { type: String, default: 'Time Left' },
  stat3Value: { type: String, default: '89' },
  stat3Label: { type: String, default: 'Slots Available' },
  ctaLine1: { type: String, default: 'Those who hesitate fall behind.' },
  ctaLine2: { type: String, default: 'Those who step forward, leave their mark.' },
  buttonText: { type: String, default: 'Start Your Journey - Register Now' },
  countdownTargetDate: { type: Date, default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
}, { timestamps: true });

module.exports = mongoose.model('ZoneDeadlineSettings', zoneDeadlineSettingsSchema);
