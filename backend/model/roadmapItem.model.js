const mongoose = require('mongoose');

const roadmapItemSchema = new mongoose.Schema({
  icon: { type: String, default: 'FileText' },
  headline: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RoadmapItem', roadmapItemSchema);
