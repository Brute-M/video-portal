const express = require('express');
const router = express.Router();
const ctrl = require('../controller/registrationVideoController');
const authenticate = require('../middleware/authMiddleware');
const multer = require('multer');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max for a thumbnail
});

// Public: get active videos only
router.get('/', ctrl.getVideos);

// Admin: get all (including inactive)
router.get('/all', authenticate, ctrl.getAllVideos);

// Admin: GET settings
router.get('/settings', authenticate, ctrl.getSettings);

// Admin: UPDATE settings
router.put('/settings', authenticate, ctrl.updateSettings);

// Admin: CRUD (with optional thumbnail file upload)
router.post('/', authenticate, upload.single('thumbnailFile'), uploadToPublicBucket, ctrl.createVideo);
router.put('/:id', authenticate, upload.single('thumbnailFile'), uploadToPublicBucket, ctrl.updateVideo);
router.delete('/:id', authenticate, ctrl.deleteVideo);

module.exports = router;
