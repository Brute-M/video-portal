const mongoose = require('mongoose');

const influencerLinkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9][a-z0-9_-]{0,39}$/
  },
  targetUrl: { type: String, default: '/registration' },
  description: { type: String },
  originalPrice: { type: Number, default: 1499 },
  discountPrice: { type: Number, default: 999 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  expiresAt: { type: Date },
  // Denormalized counters for dashboard performance
  totalClicks: { type: Number, default: 0 },
  totalRegistrations: { type: Number, default: 0 },
  totalPayments: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}, { timestamps: true });

// slug already has unique: true (creates an index); do not add duplicate index
influencerLinkSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('InfluencerLink', influencerLinkSchema);
