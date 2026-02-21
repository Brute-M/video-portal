const router = require('express').Router();
const siteSettingsController = require('../controller/siteSettingsController');
const authenticate = require('../middleware/authMiddleware');
const upload = siteSettingsController.upload;
const uploadBanner = siteSettingsController.uploadBanner;
const uploadTeamsBanner = siteSettingsController.uploadTeamsBanner;

router.get('/', siteSettingsController.getSettings);
router.put('/', authenticate, siteSettingsController.updateSettings);
router.post('/upload-social-icon', authenticate, upload.single('image'), siteSettingsController.uploadSocialIcon);
router.post('/upload-banner-image', authenticate, uploadBanner.single('image'), siteSettingsController.uploadBannerImage);
router.post('/upload-teams-banner-image', authenticate, uploadTeamsBanner.single('image'), siteSettingsController.uploadTeamsBannerImage);

module.exports = router;
