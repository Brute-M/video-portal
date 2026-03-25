const mongoose = require('mongoose');

const playerStorySettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  badgeText: { type: String, default: 'Player Stories' },
  titleBefore: { type: String, default: 'LIVES CHANGED BY' },
  titleHighlight: { type: String, default: 'BRPL' },
  subtitle: { type: String, default: 'Real stories from real players across India who found their stage.' },
  backgroundImage: { type: String, default: '/artist.png' },
}, { timestamps: true });

module.exports = mongoose.model('PlayerStorySettings', playerStorySettingsSchema);
