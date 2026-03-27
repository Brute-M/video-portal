const mongoose = require('mongoose');

const legalPageSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, enum: ['privacy_policy', 'terms_conditions', 'rule_book'] },
    title: { type: String, default: '' },
    content: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('LegalPage', legalPageSchema);
