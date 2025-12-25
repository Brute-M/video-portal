const mongoose = require('mongoose');

const influencerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    role: { type: String, default: 'influencer' },
    address: { type: String },
    image: { type: String }, // URL or path
    referralCode: { type: String, unique: true },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Influencer', influencerSchema);
