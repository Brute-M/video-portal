const router = require('express').Router();
const siteSettingsController = require('../controller/siteSettingsController');
const authenticate = require('../middleware/authMiddleware');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

router.get('/', siteSettingsController.getSettings);
router.get('/presign-url', siteSettingsController.getPresignedUrl);
router.put('/', authenticate, siteSettingsController.updateSettings);
router.post('/upload-social-icon', authenticate, upload.single('image'), uploadToPublicBucket, siteSettingsController.uploadSocialIcon);
router.post('/upload-banner-image', authenticate, upload.single('image'), uploadToPublicBucket, siteSettingsController.uploadBannerImage);
router.post('/upload-teams-banner-image', authenticate, upload.single('image'), uploadToPublicBucket, siteSettingsController.uploadTeamsBannerImage);

module.exports = router;
