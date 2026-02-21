const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema({
    bannerImage: {
        type: String, // URL of the banner image
    },
    videoUrl: {
        type: String, // Video URL (e.g. YouTube or uploaded path)
    },
    videoTitle: {
        type: String,
        required: false
    },
    videoDescription: {
        type: String,
        required: false
    },
    // About BRPL specific fields
    aboutBrplImage: {
        type: String, // URL of the About BRPL section image
    },
    aboutBrplTitle: {
        type: String, // Title for About BRPL section
        required: false
    },
    aboutBrplDescription: {
        type: String, // Description for About BRPL section (rich text?)
        required: false
    },
    // Mission & Vision fields
    missionTitle: {
        type: String,
        default: "Our Mission"
    },
    missionDescription: {
        type: String, // Rich text
    },
    missionImage: {
        type: String,
    },
    visionTitle: {
        type: String,
        default: "Our Vision"
    },
    visionDescription: {
        type: String, // Rich text
    },
    visionImage: {
        type: String,
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

module.exports = mongoose.model('AboutUs', aboutUsSchema);
