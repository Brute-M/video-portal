const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending_payment', 'completed'],
        default: 'pending_payment'
    },
    paymentId: {
        type: String
    },
    amount: {
        type: Number
    }
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
