const express = require('express');
const router = express.Router();
const cmsController = require('../controller/cmsController');

// Banner Routes
router.get('/banners', cmsController.getBanners);
router.post('/banners', cmsController.upload.single('background'), cmsController.createBanner);
router.put('/banners/:id', cmsController.upload.single('background'), cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);

// Who We Are Routes
router.get('/who-we-are', cmsController.getWhoWeAre);
router.post('/who-we-are', cmsController.upload.single('image'), cmsController.updateWhoWeAre); // Use POST to create/update
router.put('/who-we-are', cmsController.upload.single('image'), cmsController.updateWhoWeAre);

// About Us Routes
router.get('/about-us', cmsController.getAboutUs);
router.post('/about-us/banner', cmsController.upload.single('bannerImage'), cmsController.updateAboutUsBanner);
router.post('/about-us/video', cmsController.updateAboutUsVideo); // Video URL update
router.post('/about-us/about-brpl', cmsController.upload.single('aboutBrplImage'), cmsController.updateAboutBrpl);
router.post('/about-us/mission-vision',
    cmsController.upload.fields([
        { name: 'missionImage', maxCount: 1 },
        { name: 'visionImage', maxCount: 1 }
    ]),
    cmsController.updateMissionVision
);

module.exports = router;
