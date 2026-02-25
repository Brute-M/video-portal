const mongoose = require('mongoose');

const seoMetaSchema = new mongoose.Schema({
    pagePath: {
        type: String,
        required: true,
        unique: true,
        enum: [
            '/', '/about-us', '/teams', '/events', '/career',
            '/partners', '/faqs', '/registration', '/contact-us',
            '/influencers', '/login', '/dashboard'
        ] // Keep strict or remove enum if you want it purely dynamic. Let's remove enum to make it fully dynamic as requested ("all pages dynamic").
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    keywords: { type: String, default: "" },
}, { timestamps: true });

// Any route can have meta + OG tags (dynamic).
const SeoMeta = mongoose.model('SeoMeta', new mongoose.Schema({
    pagePath: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    keywords: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
}, { timestamps: true }));

module.exports = SeoMeta;
