const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    metaTitle: { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    featuredImage: { type: String, default: '' },
    content: { type: String, default: '' },
    /** When true, frontend outputs Article schema (JSON-LD) for SEO */
    enableSchema: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true }
}, { timestamps: true });

newsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('News', newsSchema);
