const mongoose = require('mongoose');

const influencerTrackingSchema = new mongoose.Schema({
  influencerLinkId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerLink', required: true, index: true },
  trackingId: { type: String, index: true },
  ipAddress: { type: String },
  userAgent: { type: String, maxlength: 512 },
  clickedAt: { type: Date, default: Date.now },
  registeredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentId: { type: String },
  revenueAmount: { type: Number }
}, { timestamps: true });

influencerTrackingSchema.index({ influencerLinkId: 1, trackingId: 1 }, { sparse: true });
influencerTrackingSchema.index({ clickedAt: -1 });

module.exports = mongoose.model('InfluencerTracking', influencerTrackingSchema);
