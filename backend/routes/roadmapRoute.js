const express = require('express');
const router = express.Router();
const ctrl = require('../controller/roadmapController');
const authenticate = require('../middleware/authMiddleware');
const multer = require('multer');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Public: get active items only
router.get('/', ctrl.getItems);

// Admin: get all (including inactive)
router.get('/all', authenticate, ctrl.getAllItems);

// Admin: settings (with optional background image upload)
router.get('/settings', authenticate, ctrl.getSettings);
router.put('/settings', authenticate, upload.single('backgroundImageFile'), uploadToPublicBucket, ctrl.updateSettings);

// Admin: CRUD
router.post('/', authenticate, ctrl.createItem);
router.put('/:id', authenticate, ctrl.updateItem);
router.delete('/:id', authenticate, ctrl.deleteItem);

module.exports = router;
