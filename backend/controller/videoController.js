
const Video = require('../model/video.model');
const User = require('../model/user.model');
const { s3Client, deleteFromS3, getPresignedUrl } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const mongoose = require('mongoose');
const PAYMENT_CONFIG = require('../config/payment');
const Payment = require('../model/payment.model');
const { drawInvoice, createInvoiceBuffer, sendInvoiceEmail } = require('../utils/pdfGenerator');

const storage = multerS3({
    s3: s3Client,
    bucket: 'brpl-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        const userId = req.userId ? req.userId.toString() : 'anonymous';
        cb(null, `${userId}/${Date.now()}-${file.originalname}`);
    },
    limits: {
        fileSize: 1024 * 1024 * 1024 // 1GB
    }
});

const upload = multer({ storage: storage });

const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ statusCode: 400, data: { message: 'No video file uploaded' } });
        }

        const user = await User.findById(req.userId);
        const isAlreadyPaid = user?.isPaid || user?.isFromLandingPage;

        const newVideo = new Video({
            userId: req.userId,
            filename: req.file.key,
            path: req.file.location,
            originalName: req.file.originalname,
            size: req.file.size,
            status: isAlreadyPaid ? 'completed' : 'pending_payment'
        });

        await newVideo.save();

        res.status(201).json({
            statusCode: 201,
            data: {
                message: isAlreadyPaid ? 'Video uploaded successfully.' : 'Video uploaded successfully to S3. Payment required to finalize.',
                videoId: newVideo._id,
                status: isAlreadyPaid ? 'completed' : 'pending_payment',
                url: req.file.location,
                isFromLandingPage: user?.isFromLandingPage
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ statusCode: 500, data: { message: 'Server error during video upload' } });
    }
};


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

        // Record the payment
        await Payment.create({
            userId: req.userId,
            videoId: video._id,
            transactionId: paymentId,
            amount: 1499,
            type: 'video',
            status: 'completed'
        });

        let pdfBuffer = null;
        try {
            pdfBuffer = await createInvoiceBuffer(video, user);
        } catch (pdfError) {
            console.error("Failed to generate PDF for email", pdfError);
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const previewLink = `${baseUrl}/video/invoice/${video._id}?type=view`;
        const downloadLink = `${baseUrl}/video/invoice/${video._id}`;

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

        if (video.status !== 'completed') {
            return res.status(400).json({ message: "Invoice not available for this video" });
        }

        // Fallback for missing paymentId
        if (!video.paymentId) {
            video.paymentId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            // Optional: Save it back to DB so it persists?
            // await video.save(); 
            // Better to just use it for the PDF generation for now to avoid side effects
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

const getLatestVideo = async (req, res) => {
    try {
        const video = await Video.findOne({ userId: req.userId })
            .sort({ createdAt: -1 });

        if (!video) {
            return res.json({ statusCode: 404, data: { message: 'No videos found for this user' } });
        }

        res.json({ statusCode: 200, data: video });
    } catch (error) {
        console.error('Error fetching latest video:', error);
        res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
    }
};



module.exports = {
    upload,
    uploadVideo,
    verifyPayment,
    getUserVideos,
    getVideoById,
    getLatestVideo,
    deleteVideo,
    downloadInvoice,
};
