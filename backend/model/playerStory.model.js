const mongoose = require('mongoose');

const playerStorySchema = new mongoose.Schema({
  quote: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },       // e.g. "25, TAMIL NADU"
  highlight: { type: String, default: '' },      // e.g. "Dream Realized"
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PlayerStory', playerStorySchema);
