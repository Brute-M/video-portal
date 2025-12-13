const Video = require('../model/video.model');
const User = require('../model/user.model');
const { s3Client, deleteFromS3, getPresignedUrl } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const mongoose = require('mongoose');
const PAYMENT_CONFIG = require('../config/payment');

const storage = multerS3({
    s3: s3Client,
    bucket: 'brpl-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        const userId = req.userId ? req.userId.toString() : 'anonymous';
        cb(null, `${userId}/${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ statusCode: 400, data: { message: 'No video file uploaded' } });
        }

        const newVideo = new Video({
            userId: req.userId,
            filename: req.file.key,
            path: req.file.location,
            originalName: req.file.originalname,
            size: req.file.size,
            status: 'pending_payment'
        });

        await newVideo.save();

        res.status(201).json({
            statusCode: 201,
            data: {
                message: 'Video uploaded successfully to S3. Payment required to finalize.',
                videoId: newVideo._id,
                status: 'pending_payment',
                url: req.file.location
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ statusCode: 500, data: { message: 'Server error during video upload' } });
    }
};

const { sendInvoiceEmail } = require('../utils/emailService');
const { createInvoiceBuffer, drawInvoice } = require('../utils/pdfGenerator');

const verifyPayment = async (req, res) => {
    const { videoId, paymentId } = req.body;

    if (!videoId || !paymentId) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Video ID and Payment ID are required' } });
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Invalid Video ID format' } });
    }

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (video.userId.toString() !== req.userId) {
            return res.status(403).json({ statusCode: 403, data: { message: 'Unauthorized' } });
        }

        console.log(`Verifying payment ${paymentId} using Key: ${PAYMENT_CONFIG.ORANGE_SECRET_KEY}`);

        video.status = 'completed';
        video.paymentId = paymentId;
        await video.save();

        const user = await User.findById(req.userId);
        await User.findByIdAndUpdate(req.userId, { isPaid: true });

        let pdfBuffer = null;
        try {
            pdfBuffer = await createInvoiceBuffer(video, user);
        } catch (pdfError) {
            console.error("Failed to generate PDF for email", pdfError);
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const previewLink = `${baseUrl}/api/video/invoice/${video._id}?type=view`;
        const downloadLink = `${baseUrl}/api/video/invoice/${video._id}`;

        if (user) {
            sendInvoiceEmail(user, video, downloadLink, previewLink, pdfBuffer)
                .catch(err => console.error("Email send failed", err));
        }

        res.json({ statusCode: 200, data: { message: 'Payment verified. Video upload finalized.', status: 'completed' } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ statusCode: 500, data: { message: 'Server error during payment verification' } });
    }
};

const getUserVideos = async (req, res) => {
    try {
        const videos = await Video.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ statusCode: 200, data: videos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching videos", error: error.message });
    }
};

const getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        if (video.filename) {
            const signedUrl = await getPresignedUrl(video.filename);
            const videoData = { ...video.toObject(), path: signedUrl || video.path };
            return res.status(200).json(videoData);
        }

        res.status(200).json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching video", error: error.message });
    }
};

const deleteVideo = async (req, res) => {
    try {
        const video = await Video.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!video) return res.status(404).json({ message: "Video not found or unauthorized" });

        if (video.filename) {
            await deleteFromS3(video.filename);
        }
        // Fallback or cleanup old local files if needed (optional)
        // But since we are migrating, we focus on S3.

        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting video", error: error.message });
    }
};

const downloadInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // Check for 'view' or 'download'

        const video = await Video.findOne({ _id: id, userId: req.userId });

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (video.status !== 'completed' || !video.paymentId) {
            return res.status(400).json({ message: "Invoice not available for this video" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');

        if (type === 'view') {
            res.setHeader('Content-Disposition', `inline; filename=invoice-${video.paymentId}.pdf`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${video.paymentId}.pdf`);
        }

        doc.pipe(res);

        // Use shared drawing logic
        drawInvoice(doc, video, user);

        doc.end();

    } catch (error) {
        console.error("Invoice generation error", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Could not generate invoice" });
        }
    }
};

module.exports = {
    upload,
    uploadVideo,
    verifyPayment,
    getUserVideos,
    getVideoById,
    deleteVideo,
    downloadInvoice
};

