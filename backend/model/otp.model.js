const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: false, // Changed from true to allow email-only OTPs
    },
    email: {
        type: String,
        required: false,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // Expires in 5 minutes (300 seconds)
    }
});

module.exports = mongoose.model('Otp', otpSchema);
