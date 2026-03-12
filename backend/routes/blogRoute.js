const express = require('express');
const router = express.Router();
const multer = require('multer');
const blogController = require('../controller/blogController');
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
router.get('/', blogController.getBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);

// Admin (protected)
router.get('/admin/list', authenticate, blogController.adminGetBlogs);
router.get('/admin/:id', authenticate, blogController.adminGetBlog);
router.post('/admin/create', authenticate, upload.single('featuredImage'), handleMulterError, uploadToPublicBucket, blogController.createBlog);
router.put('/admin/:id', authenticate, upload.single('featuredImage'), handleMulterError, uploadToPublicBucket, blogController.updateBlog);
router.delete('/admin/:id', authenticate, blogController.deleteBlog);

module.exports = router;
