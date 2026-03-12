const express = require('express');
const router = express.Router();
const ambassadorController = require('../controller/ambassadorController');
const { s3Client } = require('../utils/s3Client');
const multer = require('multer');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

router.get('/', ambassadorController.getAllAmbassadors);
router.get('/:id', ambassadorController.getAmbassadorById);
router.post('/', upload.single('image'), uploadToPublicBucket, ambassadorController.createAmbassador);
router.put('/:id', upload.single('image'), uploadToPublicBucket, ambassadorController.updateAmbassador);
router.delete('/:id', ambassadorController.deleteAmbassador);

module.exports = router;
