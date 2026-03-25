const mongoose = require('mongoose');

const roadmapSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  titleBefore: { type: String, default: 'YOUR JOURNEY TO' },
  titleHighlight: { type: String, default: 'GLORY' },
  backgroundImage: { type: String, default: '/banner.png' }
}, { timestamps: true });

module.exports = mongoose.model('RoadmapSettings', roadmapSettingsSchema);
