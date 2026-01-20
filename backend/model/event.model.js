const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    src: {
        type: String,
        required: true
    },
    poster: {
        type: String
    },
    width: {
        type: Number
    },
    height: {
        type: Number
    }
});

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    media: [mediaSchema]
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
