const mongoose = require('mongoose');

const zoneDeadlineStatSchema = new mongoose.Schema({
  value: { type: String, required: true },       // e.g. "78%", "89"
  label: { type: String, required: true },        // e.g. "Registrations Completed"
  isCountdown: { type: Boolean, default: false }, // if true, renders as countdown timer instead of value
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ZoneDeadlineStat', zoneDeadlineStatSchema);
