const express = require('express');
const router = express.Router();
const cmsController = require('../controller/cmsController');
const { createS3Upload } = require('../utils/uploadHelper');

const uploadBanners = createS3Upload('cms/banners', { limits: { fileSize: 10 * 1024 * 1024 } });
const uploadWhoWeAre = createS3Upload('cms/who-we-are');
const uploadAboutUs = createS3Upload('cms/about-us');

// Banner Routes
router.get('/banners', cmsController.getBanners);
router.post('/banners', uploadBanners.single('background'), cmsController.createBanner);
router.put('/banners/:id', uploadBanners.single('background'), cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);

// Who We Are Routes
router.get('/who-we-are', cmsController.getWhoWeAre);
router.post('/who-we-are', uploadWhoWeAre.single('image'), cmsController.updateWhoWeAre);
router.put('/who-we-are', uploadWhoWeAre.single('image'), cmsController.updateWhoWeAre);

// About Us Routes
router.get('/about-us', cmsController.getAboutUs);
router.post('/about-us/banner', uploadAboutUs.single('bannerImage'), cmsController.updateAboutUsBanner);
router.post('/about-us/video', cmsController.updateAboutUsVideo);
router.post('/about-us/about-brpl', uploadAboutUs.single('aboutBrplImage'), cmsController.updateAboutBrpl);
router.post('/about-us/mission-vision',
    uploadAboutUs.fields([
        { name: 'missionImage', maxCount: 1 },
        { name: 'visionImage', maxCount: 1 }
    ]),
    cmsController.updateMissionVision
);

module.exports = router;
