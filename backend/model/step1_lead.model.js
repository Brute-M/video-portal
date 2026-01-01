const mongoose = require('mongoose');

const step1LeadSchema = new mongoose.Schema({
    mobile: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    role: { type: String },
    state: { type: String },
    city: { type: String },
    trackingId: { type: String }, // For linking with visits
}, { timestamps: true });

const Step1Lead = mongoose.model('Step1Lead', step1LeadSchema);

module.exports = Step1Lead;
