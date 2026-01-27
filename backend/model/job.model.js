const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    jdFile: {
        type: String, // URL to S3
        required: false
    },
    jdContent: {
        type: String, // Rich Text
        required: false
    },
    salary: {
        type: String, // CTC
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open',
        required: true
    },
    experience: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
