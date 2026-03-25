const express = require('express');
const router = express.Router();
const ctrl = require('../controller/playerStoryController');
const authenticate = require('../middleware/authMiddleware');
const multer = require('multer');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Public
router.get('/', ctrl.getStories);

// Admin
router.get('/all', authenticate, ctrl.getAllStories);
router.get('/settings', authenticate, ctrl.getSettings);
router.put('/settings', authenticate, upload.single('backgroundImageFile'), uploadToPublicBucket, ctrl.updateSettings);
router.post('/', authenticate, ctrl.createStory);
router.put('/:id', authenticate, ctrl.updateStory);
router.delete('/:id', authenticate, ctrl.deleteStory);

module.exports = router;
