const mongoose = require('mongoose');

const numbersSpeakItemSchema = new mongoose.Schema({
  icon: { type: String, default: 'Trophy' }, // lucide-react icon name
  hook: { type: String, required: true },     // e.g. "₹3 Crore"
  descriptor: { type: String, required: true }, // e.g. "TOTAL PRIZE POOL"
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('NumbersSpeakItem', numbersSpeakItemSchema);
