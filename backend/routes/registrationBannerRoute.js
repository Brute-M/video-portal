const express = require('express');
const router = express.Router();
const ctrl = require('../controller/registrationBannerController');
const authenticate = require('../middleware/authMiddleware');
const multer = require('multer');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Public
router.get('/', ctrl.getSettings);

// Admin
router.put('/settings', authenticate, upload.fields([
  { name: 'backgroundImageFile', maxCount: 1 },
  { name: 'mobileBackgroundImageFile', maxCount: 1 }
]), uploadToPublicBucket, ctrl.updateSettings);

module.exports = router;
