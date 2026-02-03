const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true, // URL or path
    },
    logoKey: {
        type: String, // Store S3 key for generating presigned URLs
    },
    order: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);
