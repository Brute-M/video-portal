const mongoose = require("mongoose");

const ambassadorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    designation: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false, // Optional initially, but recommended
    },
    image: {
        type: String,
        required: true, // URL or path
    },
    imageKey: {
        type: String, // Store S3 key for generating presigned URLs
    },
    order: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model("Ambassador", ambassadorSchema);
