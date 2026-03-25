const mongoose = require('mongoose');

const registrationVideoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  thumbnail: { type: String, required: true }, // URL or path
  duration: { type: String, default: '' },
  videoSrc: { type: String, required: true }, // video URL
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RegistrationVideo', registrationVideoSchema);
