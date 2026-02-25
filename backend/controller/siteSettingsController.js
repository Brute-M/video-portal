const SiteSettings = require('../model/siteSettings.model');
const { resolveImageUrl, getPresignedUrl } = require('../utils/s3Client');

const DEFAULT_SETTINGS = {
    key: 'main',
    contactAddress: 'Ground Floor, Suite G-01, Procapitus Business Park, D-247/4A, D Block, Sector 63, Noida, Uttar Pradesh 201309',
    contactPhone: '+(91) 81309 55866',
    contactPhoneSecondary: '+(91) 98215 63585',
    contactEmail: 'info@brpl.net',
    whatsappNumber: '918130955866',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.519595657341!2d77.369!3d28.586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sWorld%20Trade%20Centre!5e0!3m2!1sen!2sin!4v1700000000000',
    socialLinks: [
        { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61584782136820', image: '/facebook.png' },
        { name: 'Twitter', url: 'https://x.com/BRPLOfficial', image: '/twiter.png' },
        { name: 'Instagram', url: 'https://www.instagram.com/brpl.t10', image: '/instagram.png' }
    ],
    bannerImage: '',
    bannerTitles: {},
    teamsBannerImage: '',
    teamsVideoUrl: '',
    customHeadScripts: ''
};

// GET presigned URL for an S3 key (for admin preview when key is stored)
exports.getPresignedUrl = async (req, res) => {
    try {
        const key = req.query.key;
        if (!key || typeof key !== 'string') {
            return res.status(400).json({ success: false, message: 'Missing key' });
        }
        const url = await getPresignedUrl(key);
        if (!url) return res.status(404).json({ success: false, message: 'Could not generate URL' });
        res.status(200).json({ success: true, url });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET (public) - returns current site settings or defaults; resolves S3 image keys to presigned URLs for header/footer
exports.getSettings = async (req, res) => {
    try {
        let settings = await SiteSettings.findOne({ key: 'main' });
        if (!settings) {
            settings = await SiteSettings.create(DEFAULT_SETTINGS);
        }
        const data = settings.toObject ? settings.toObject() : settings;
        if (data.bannerImage) data.bannerImage = await resolveImageUrl(data.bannerImage);
        if (data.teamsBannerImage) data.teamsBannerImage = await resolveImageUrl(data.teamsBannerImage);
        // Use default social links if none in DB so header/footer always have icons
        if (!Array.isArray(data.socialLinks) || data.socialLinks.length === 0) {
            data.socialLinks = DEFAULT_SETTINGS.socialLinks;
        }
        for (let i = 0; i < data.socialLinks.length; i++) {
            if (data.socialLinks[i].image) {
                data.socialLinks[i].image = await resolveImageUrl(data.socialLinks[i].image);
            }
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT (admin) - update settings
exports.updateSettings = async (req, res) => {
    try {
        const { contactAddress, contactPhone, contactPhoneSecondary, contactEmail, whatsappNumber, mapEmbedUrl, socialLinks, bannerImage, bannerTitles, teamsBannerImage, teamsVideoUrl, customHeadScripts, customBodyScripts } = req.body;
        const update = {};
        if (contactAddress !== undefined) update.contactAddress = contactAddress;
        if (contactPhone !== undefined) update.contactPhone = contactPhone;
        if (contactPhoneSecondary !== undefined) update.contactPhoneSecondary = contactPhoneSecondary;
        if (contactEmail !== undefined) update.contactEmail = contactEmail;
        if (whatsappNumber !== undefined) update.whatsappNumber = String(whatsappNumber).replace(/\D/g, '');
        if (mapEmbedUrl !== undefined) update.mapEmbedUrl = mapEmbedUrl;
        if (socialLinks !== undefined) {
            try {
                update.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid socialLinks JSON' });
            }
        }
        if (bannerImage !== undefined) update.bannerImage = bannerImage;
        if (teamsBannerImage !== undefined) update.teamsBannerImage = teamsBannerImage;
        if (teamsVideoUrl !== undefined) update.teamsVideoUrl = teamsVideoUrl;
        if (bannerTitles !== undefined) {
            try {
                update.bannerTitles = typeof bannerTitles === 'string' ? JSON.parse(bannerTitles) : bannerTitles;
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid bannerTitles JSON' });
            }
        }
        if (customHeadScripts !== undefined) update.customHeadScripts = String(customHeadScripts ?? '');
        if (customBodyScripts !== undefined) update.customBodyScripts = String(customBodyScripts ?? '');
        let settings = await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        if (!settings) {
            settings = await SiteSettings.create({ ...DEFAULT_SETTINGS, ...update });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST upload social icon (admin) - path is S3 key (save in socialLinks[].image); url for preview
exports.uploadSocialIcon = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const url = await resolveImageUrl(req.file.key);
        res.status(200).json({ success: true, path: req.file.key, url: url || req.file.key });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST upload banner image (admin)
exports.uploadBannerImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: { bannerImage: req.file.key } },
            { new: true, upsert: true }
        );
        const url = await resolveImageUrl(req.file.key);
        res.status(200).json({ success: true, path: req.file.key, url });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST upload teams page banner image (admin)
exports.uploadTeamsBannerImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: { teamsBannerImage: req.file.key } },
            { new: true, upsert: true }
        );
        const url = await resolveImageUrl(req.file.key);
        res.status(200).json({ success: true, path: req.file.key, url });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
