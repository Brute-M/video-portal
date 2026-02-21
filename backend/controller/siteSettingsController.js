const SiteSettings = require('../model/siteSettings.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'social-' + Date.now() + path.extname(file.originalname));
    }
});
const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'banner-' + Date.now() + path.extname(file.originalname));
    }
});
const teamsBannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'teams-banner-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});
const uploadBanner = multer({
    storage: bannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});
const uploadTeamsBanner = multer({
    storage: teamsBannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

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
    teamsVideoUrl: ''
};

// GET (public) - returns current site settings or defaults
exports.getSettings = async (req, res) => {
    try {
        let settings = await SiteSettings.findOne({ key: 'main' });
        if (!settings) {
            settings = await SiteSettings.create(DEFAULT_SETTINGS);
        }
        const data = settings.toObject ? settings.toObject() : settings;
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT (admin) - update settings
exports.updateSettings = async (req, res) => {
    try {
        const { contactAddress, contactPhone, contactPhoneSecondary, contactEmail, whatsappNumber, mapEmbedUrl, socialLinks, bannerImage, bannerTitles, teamsBannerImage, teamsVideoUrl } = req.body;
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

// POST upload social icon (admin)
exports.uploadSocialIcon = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const imagePath = 'uploads/' + req.file.filename;
        res.status(200).json({ success: true, path: imagePath });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST upload banner image (admin) - use field name 'image' for consistency
exports.uploadBannerImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const imagePath = 'uploads/' + req.file.filename;
        await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: { bannerImage: imagePath } },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, path: imagePath });
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
        const imagePath = 'uploads/' + req.file.filename;
        await SiteSettings.findOneAndUpdate(
            { key: 'main' },
            { $set: { teamsBannerImage: imagePath } },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, path: imagePath });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.upload = upload;
exports.uploadBanner = uploadBanner;
exports.uploadTeamsBanner = uploadTeamsBanner;
