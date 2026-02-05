const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    partnershipType: {
        type: String,
        required: true,
        enum: ['Sponsorship', 'Co-Branding', 'Joint Venture', 'None of the above']
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Partner', partnerSchema);
