const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    url: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' }
}, { _id: false });

const siteSettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, default: 'main' },
    contactAddress: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactPhoneSecondary: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    socialLinks: [socialLinkSchema],
    bannerImage: { type: String, default: '' },
    bannerTitles: { type: mongoose.Schema.Types.Mixed, default: {} },
    teamsBannerImage: { type: String, default: '' },
    teamsVideoUrl: { type: String, default: '' },
    admin2FASecret: { type: String, default: '' },
    admin2FAVerified: { type: Boolean, default: false },
    admin2FAEnabled: { type: Boolean, default: false },
    adminPasswordHash: { type: String, default: '' },
    /** Google Analytics / Search Console: script tags to inject in <head> (paste from GSC/GA) */
    customHeadScripts: { type: String, default: '' },
    /** Global script tags to inject just before closing </body> tag */
    customBodyScripts: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
