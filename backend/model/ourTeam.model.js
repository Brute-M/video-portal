const mongoose = require('mongoose');

const ourTeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String, // URL/Path to the image
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('OurTeam', ourTeamSchema);
