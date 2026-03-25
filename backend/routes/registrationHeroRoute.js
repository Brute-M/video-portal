const express = require('express');
const router = express.Router();
const ctrl = require('../controller/registrationHeroController');
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
router.put('/settings', authenticate, upload.single('backgroundImageFile'), uploadToPublicBucket, ctrl.updateSettings);

module.exports = router;
