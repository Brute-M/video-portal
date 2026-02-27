const Banner = require('../model/banner.model');
const AboutUs = require('../model/aboutus.model');
const WhoWeAre = require('../model/whoweare.model');
const { deleteFromS3, resolveImageUrl } = require('../utils/s3Client');

function isS3Key(value) {
    return value && typeof value === 'string' && !value.startsWith('http') && !value.startsWith('uploads/');
}

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

        const background = file.key;
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
        const backgroundUrl = await resolveImageUrl(background);
        res.status(201).json({ success: true, data: { ...newBanner.toObject(), background: backgroundUrl } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        const withUrls = await Promise.all(banners.map(async (b) => {
            const obj = b.toObject ? b.toObject() : b;
            obj.background = await resolveImageUrl(obj.background);
            return obj;
        }));
        res.status(200).json({ success: true, data: withUrls });
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

        if (isS3Key(banner.background)) {
            await deleteFromS3(banner.background).catch(err => console.error('S3 delete error:', err));
        }

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

        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });

        const updateData = { videoUrl, title, subtitle, isActive: isActive === 'true' || isActive === true };

        if (file) {
            if (isS3Key(banner.background)) {
                await deleteFromS3(banner.background).catch(err => console.error('S3 delete error:', err));
            }
            updateData.background = file.key;
            updateData.backgroundSize = formatFileSize(file.size);
        }

        const updated = await Banner.findByIdAndUpdate(id, updateData, { new: true });
        const backgroundUrl = await resolveImageUrl(updated.background);
        res.status(200).json({ success: true, data: { ...updated.toObject(), background: backgroundUrl } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Who We Are Controllers ---

exports.getWhoWeAre = async (req, res) => {
    try {
        const data = await WhoWeAre.findOne().sort({ createdAt: -1 });
        if (!data) return res.status(200).json({ success: true, data: null });
        const obj = data.toObject ? data.toObject() : data;
        if (obj.image) obj.image = await resolveImageUrl(obj.image);
        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateWhoWeAre = async (req, res) => {
    try {
        const { title, titleHeadingLevel, titleColor, subtitle, tagline, description, videoUrl } = req.body;
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
        if (['h1', 'h2', 'h3'].includes(titleHeadingLevel)) {
            updateData.titleHeadingLevel = titleHeadingLevel;
        }
        if (titleColor !== undefined) {
            updateData.titleColor = titleColor && /^#[0-9A-Fa-f]{6}$/.test(titleColor) ? titleColor : '';
        }

        if (file) {
            if (data && isS3Key(data.image)) {
                await deleteFromS3(data.image).catch(err => console.error('S3 delete error:', err));
            }
            updateData.image = file.key;
        }

        if (data) {
            data = await WhoWeAre.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new WhoWeAre(updateData);
            await data.save();
        }

        const obj = data.toObject ? data.toObject() : data;
        if (obj.image) obj.image = await resolveImageUrl(obj.image);
        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- About Us Controllers ---

exports.getAboutUs = async (req, res) => {
    try {
        const data = await AboutUs.findOne().sort({ createdAt: -1 });
        if (!data) return res.status(200).json({ success: true, data: null });
        const obj = data.toObject ? data.toObject() : data;
        if (obj.bannerImage) obj.bannerImage = await resolveImageUrl(obj.bannerImage);
        if (obj.aboutBrplImage) obj.aboutBrplImage = await resolveImageUrl(obj.aboutBrplImage);
        if (obj.missionImage) obj.missionImage = await resolveImageUrl(obj.missionImage);
        if (obj.visionImage) obj.visionImage = await resolveImageUrl(obj.visionImage);
        res.status(200).json({ success: true, data: obj });
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
            if (data && isS3Key(data.bannerImage)) {
                await deleteFromS3(data.bannerImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.bannerImage = "";
        } else if (file) {
            if (data && isS3Key(data.bannerImage)) {
                await deleteFromS3(data.bannerImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.bannerImage = file.key;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        const obj = data.toObject ? data.toObject() : data;
        if (obj.bannerImage) obj.bannerImage = await resolveImageUrl(obj.bannerImage);
        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAboutUsVideo = async (req, res) => {
    try {
        const { videoUrl, videoTitle, videoDescription, remove } = req.body;

        let data = await AboutUs.findOne().sort({ createdAt: -1 });

        let updateData = { updatedAt: Date.now() };

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

        const obj = data.toObject ? data.toObject() : data;
        if (obj.bannerImage) obj.bannerImage = await resolveImageUrl(obj.bannerImage);
        if (obj.aboutBrplImage) obj.aboutBrplImage = await resolveImageUrl(obj.aboutBrplImage);
        if (obj.missionImage) obj.missionImage = await resolveImageUrl(obj.missionImage);
        if (obj.visionImage) obj.visionImage = await resolveImageUrl(obj.visionImage);
        res.status(200).json({ success: true, data: obj });
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
            if (data && isS3Key(data.aboutBrplImage)) {
                await deleteFromS3(data.aboutBrplImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.aboutBrplImage = "";
        } else if (file) {
            if (data && isS3Key(data.aboutBrplImage)) {
                await deleteFromS3(data.aboutBrplImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.aboutBrplImage = file.key;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        const obj = data.toObject ? data.toObject() : data;
        if (obj.bannerImage) obj.bannerImage = await resolveImageUrl(obj.bannerImage);
        if (obj.aboutBrplImage) obj.aboutBrplImage = await resolveImageUrl(obj.aboutBrplImage);
        if (obj.missionImage) obj.missionImage = await resolveImageUrl(obj.missionImage);
        if (obj.visionImage) obj.visionImage = await resolveImageUrl(obj.visionImage);
        res.status(200).json({ success: true, data: obj });
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

        const missionFile = req.files && req.files['missionImage'] ? req.files['missionImage'][0] : null;
        const visionFile = req.files && req.files['visionImage'] ? req.files['visionImage'][0] : null;

        let data = await AboutUs.findOne().sort({ createdAt: -1 });

        let updateData = { updatedAt: Date.now() };

        if (missionTitle !== undefined) updateData.missionTitle = missionTitle;
        if (missionDescription !== undefined) updateData.missionDescription = missionDescription;
        if (visionTitle !== undefined) updateData.visionTitle = visionTitle;
        if (visionDescription !== undefined) updateData.visionDescription = visionDescription;

        if (removeMissionImage === 'true') {
            if (data && isS3Key(data.missionImage)) {
                await deleteFromS3(data.missionImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.missionImage = "";
        } else if (missionFile) {
            if (data && isS3Key(data.missionImage)) {
                await deleteFromS3(data.missionImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.missionImage = missionFile.key;
        }

        if (removeVisionImage === 'true') {
            if (data && isS3Key(data.visionImage)) {
                await deleteFromS3(data.visionImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.visionImage = "";
        } else if (visionFile) {
            if (data && isS3Key(data.visionImage)) {
                await deleteFromS3(data.visionImage).catch(err => console.error('S3 delete error:', err));
            }
            updateData.visionImage = visionFile.key;
        }

        if (data) {
            data = await AboutUs.findByIdAndUpdate(data._id, updateData, { new: true });
        } else {
            data = new AboutUs(updateData);
            await data.save();
        }

        const obj = data.toObject ? data.toObject() : data;
        if (obj.bannerImage) obj.bannerImage = await resolveImageUrl(obj.bannerImage);
        if (obj.aboutBrplImage) obj.aboutBrplImage = await resolveImageUrl(obj.aboutBrplImage);
        if (obj.missionImage) obj.missionImage = await resolveImageUrl(obj.missionImage);
        if (obj.visionImage) obj.visionImage = await resolveImageUrl(obj.visionImage);
        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

