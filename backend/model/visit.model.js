const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    trackingId: { type: String, required: true, index: true }, // Unique ID generated on client
    ipAddress: { type: String },
    userAgent: { type: String },
    fbclid: { type: String },
    referralCode: { type: String }, // If present in URL
    trackend: { type: String },
    converted: { type: Boolean, default: false }, // If this visit led to a registration
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Linked user after conversion
}, { timestamps: true });

const Visit = mongoose.model('Visit', visitSchema);

module.exports = Visit;
