const mongoose = require('mongoose');

const whoWeAreSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    /** Main title heading level for SEO: 'h1' | 'h2' | 'h3'. Default h1 so home has one H1. */
    titleHeadingLevel: {
        type: String,
        enum: ['h1', 'h2', 'h3'],
        default: 'h1'
    },
    /** Main title text color (hex e.g. #000000). When set, overrides default styling. */
    titleColor: {
        type: String,
        required: false
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
