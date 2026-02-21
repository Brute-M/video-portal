const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    background: {
        type: String, // URL of the image
        required: true
    },
    backgroundSize: {
        type: String, // e.g., "1.2 MB"
    },
    videoUrl: {
        type: String, // URL for the "Play Video" button
    },
    title: {
        type: String,
        default: ""
    },
    subtitle: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Banner', bannerSchema);
