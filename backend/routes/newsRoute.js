const express = require('express');
const router = express.Router();
const multer = require('multer');
const newsController = require('../controller/newsController');
const authenticate = require('../middleware/authMiddleware');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: `Image is too large. Maximum size is 500 MB.`
            });
        }
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err) return res.status(500).json({ success: false, message: err.message });
    next();
}

// Public (no auth)
router.get('/', newsController.getNewsList);
router.get('/slug/:slug', newsController.getNewsBySlug);

// Admin (protected)
router.get('/admin/list', authenticate, newsController.adminGetNewsList);
router.get('/admin/:id', authenticate, newsController.adminGetNews);
router.post('/admin/create', authenticate, upload.single('featuredImage'), handleMulterError, uploadToPublicBucket, newsController.createNews);
router.put('/admin/:id', authenticate, upload.single('featuredImage'), handleMulterError, uploadToPublicBucket, newsController.updateNews);
router.delete('/admin/:id', authenticate, newsController.deleteNews);

module.exports = router;
