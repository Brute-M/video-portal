const express = require('express');
const router = express.Router();
const cmsController = require('../controller/cmsController');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

// Banner Routes
router.get('/banners', cmsController.getBanners);
router.post('/banners', upload.single('background'), uploadToPublicBucket, cmsController.createBanner);
router.put('/banners/:id', upload.single('background'), uploadToPublicBucket, cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);

// Who We Are Routes
router.get('/who-we-are', cmsController.getWhoWeAre);
router.post('/who-we-are', upload.single('image'), uploadToPublicBucket, cmsController.updateWhoWeAre);
router.put('/who-we-are', upload.single('image'), uploadToPublicBucket, cmsController.updateWhoWeAre);

// About Us Routes
router.get('/about-us', cmsController.getAboutUs);
router.post('/about-us/banner', upload.single('bannerImage'), uploadToPublicBucket, cmsController.updateAboutUsBanner);
router.post('/about-us/video', upload.single('video'), uploadToPublicBucket, cmsController.updateAboutUsVideo);
router.post('/about-us/about-brpl', upload.single('aboutBrplImage'), uploadToPublicBucket, cmsController.updateAboutBrpl);
router.post('/about-us/mission-vision',
    upload.fields([
        { name: 'missionImage', maxCount: 1 },
        { name: 'visionImage', maxCount: 1 }
    ]), uploadToPublicBucket,
    cmsController.updateMissionVision
);

module.exports = router;
