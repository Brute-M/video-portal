const express = require('express');
const router = express.Router();
const {
    uploadVideo,
    verifyPayment,
    upload,
    getUserVideos,
    getVideoById,
    getLatestVideo,
    deleteVideo,
    downloadInvoice,
    saveVideoAnalysis
} = require('../controller/videoController');

const authenticate = require('../middleware/authMiddleware');

// Route to upload video -> Status becomes 'pending_payment'
router.post('/upload', authenticate, upload.single('video'), uploadVideo);

// Route to verify payment -> Status becomes 'completed'
router.post('/verify-payment', authenticate, verifyPayment);

// Route to save analysis results
router.post('/:id/analysis', authenticate, saveVideoAnalysis);

// Route to get presigned URL


// CRUD Routes
router.get('/latest', authenticate, getLatestVideo); // Get most recent video
router.get('/', authenticate, getUserVideos); // List all user's videos
router.get('/:id', authenticate, getVideoById); // Get single video details
router.delete('/:id', authenticate, deleteVideo); // Delete video
router.get('/invoice/:id', authenticate, downloadInvoice); // Download Invoice


module.exports = router;
