const Banner = require('../model/banner.model');
const AboutUs = require('../model/aboutus.model');
const WhoWeAre = require('../model/whoweare.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'cms-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper to calculate file size string from bytes
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Banner Controllers ---

exports.createBanner = async (req, res) => {
    try {
        const file = req.file;
        const { videoUrl, title, subtitle, isActive } = req.body;

        if (!file) {
            return res.status(400).json({ message: "Background image is required" });
        }

        // Save relative path for portability
        const background = `uploads/${file.filename}`;
        const backgroundSize = formatFileSize(file.size);

        const newBanner = new Banner({
            background,
            backgroundSize,
            videoUrl,
            title,
            subtitle,
            isActive: isActive === 'true' || isActive === true
        });

        await newBanner.save();
        res.status(201).json({ success: true, data: newBanner });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }

        // Optional: Delete file from filesystem
        // const filename = banner.background.split('/uploads/')[1];
        // if (filename) fs.unlink(`uploads/${filename}`, (err) => { if(err) console.error(err); });

        await Banner.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Banner deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { videoUrl, title, subtitle, isActive } = req.body;
        const file = req.file;

        const updateData = { videoUrl, title, subtitle, isActive: isActive === 'true' || isActive === true };

        if (file) {
            updateData.background = `uploads/${file.filename}`;
            updateData.backgroundSize = formatFileSize(file.size);
        }

        const banner = await Banner.findByIdAndUpdate(id, updateData, { new: true });
        if (!banner) return res.status(404).json({ message: "Banner not found" });

        res.status(200).json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Who We Are Controllers ---

exports.getWhoWeAre = async (req, res) => {
    try {
        // We assume there's only one "Who We Are" section. 
        // If not exists, return empty or default code might handle it on frontend.
        const data = await WhoWeAre.findOne().sort({ createdAt: -1 }); // Get latest
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateWhoWeAre = async (req, res) => {
    try {
        const { title, subtitle, tagline, description, videoUrl } = req.body;
        const file = req.file;

        let data = await WhoWeAre.findOne().sort({ createdAt: -1 });

        const updateData = {
            title,
            subtitle,
            tagline,
            description,
            videoUrl,
            updatedAt: Date.now()
        };

        if (file) {
            updateData.image = `uploads/${file.filename}`;
        }

        if (data) {
            // Update existing
            data = await WhoWeAre.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            // Create new if doesn't exist
            data = new WhoWeAre(updateData);
            await data.save();
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- About Us Controllers ---

exports.getAboutUs = async (req, res) => {
    try {
        const data = await AboutUs.findOne().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAboutUsBanner = async (req, res) => {
    try {
        const file = req.file;
        const { remove } = req.body;
        let data = await AboutUs.findOne().sort({ createdAt: -1 });

        const updateData = { updatedAt: Date.now() };

        if (!file && !data && remove !== 'true') {
            return res.status(400).json({ message: "Banner image is required for initial setup" });
        }

        if (remove === 'true') {
            updateData.bannerImage = ""; // or null, if schema allows. string is safer for now based on current schema usage (String)
        } else if (file) {
            updateData.bannerImage = `uploads/${file.filename}`;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAboutUsVideo = async (req, res) => {
    try {
        const { videoUrl, videoTitle, videoDescription, remove } = req.body;

        let data = await AboutUs.findOne().sort({ createdAt: -1 });

        let updateData = {
            updatedAt: Date.now()
        };

        if (remove === true || remove === 'true') {
            updateData.videoUrl = "";
            updateData.videoTitle = "";
            updateData.videoDescription = "";
        } else {
            updateData.videoUrl = videoUrl;
            updateData.videoTitle = videoTitle;
            updateData.videoDescription = videoDescription;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateAboutBrpl = async (req, res) => {
    try {
        const { aboutBrplTitle, aboutBrplDescription, removeImage } = req.body;
        const file = req.file;

        let data = await AboutUs.findOne().sort({ createdAt: -1 });

        let updateData = {
            aboutBrplTitle,
            aboutBrplDescription,
            updatedAt: Date.now()
        };

        if (removeImage === 'true') {
            updateData.aboutBrplImage = "";
        } else if (file) {
            updateData.aboutBrplImage = `uploads/${file.filename}`;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateMissionVision = async (req, res) => {
    try {
        const {
            missionTitle, missionDescription,
            visionTitle, visionDescription,
            removeMissionImage, removeVisionImage
        } = req.body;

        // multer puts files in req.files['fieldname'][0]
        const missionFile = req.files['missionImage'] ? req.files['missionImage'][0] : null;
        const visionFile = req.files['visionImage'] ? req.files['visionImage'][0] : null;

        let data = await AboutUs.findOne().sort({ createdAt: -1 });

        let updateData = {
            updatedAt: Date.now()
        };

        if (missionTitle !== undefined) updateData.missionTitle = missionTitle;
        if (missionDescription !== undefined) updateData.missionDescription = missionDescription;
        if (visionTitle !== undefined) updateData.visionTitle = visionTitle;
        if (visionDescription !== undefined) updateData.visionDescription = visionDescription;

        if (removeMissionImage === 'true') {
            updateData.missionImage = "";
        } else if (missionFile) {
            updateData.missionImage = `uploads/${missionFile.filename}`;
        }

        if (removeVisionImage === 'true') {
            updateData.visionImage = "";
        } else if (visionFile) {
            updateData.visionImage = `uploads/${visionFile.filename}`;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.upload = upload;
