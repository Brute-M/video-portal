const mongoose = require('mongoose');

const whoWeAreSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    tagline: {
        type: String,
        required: false
    },
    description: {
        type: String, // Rich text content from editor
        required: true
    },
    image: {
        type: String, // URL of the right-side image
    },
    videoUrl: {
        type: String, // Optional video URL if needed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WhoWeAre', whoWeAreSchema);
