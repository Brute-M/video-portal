const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
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

// unique: true on slug already creates an index; only add extra index for sort
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);
