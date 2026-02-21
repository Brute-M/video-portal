const router = require('express').Router();
const siteSettingsController = require('../controller/siteSettingsController');
const authenticate = require('../middleware/authMiddleware');
const { createS3Upload } = require('../utils/uploadHelper');

const uploadSocial = createS3Upload('site/social', { limits: { fileSize: 2 * 1024 * 1024 } });
const uploadBanner = createS3Upload('site/banner', { limits: { fileSize: 5 * 1024 * 1024 } });
const uploadTeamsBanner = createS3Upload('site/teams-banner', { limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', siteSettingsController.getSettings);
router.get('/presign-url', siteSettingsController.getPresignedUrl);
router.put('/', authenticate, siteSettingsController.updateSettings);
router.post('/upload-social-icon', authenticate, uploadSocial.single('image'), siteSettingsController.uploadSocialIcon);
router.post('/upload-banner-image', authenticate, uploadBanner.single('image'), siteSettingsController.uploadBannerImage);
router.post('/upload-teams-banner-image', authenticate, uploadTeamsBanner.single('image'), siteSettingsController.uploadTeamsBannerImage);

module.exports = router;
