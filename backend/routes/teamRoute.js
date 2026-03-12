const express = require('express');
const router = express.Router();
const teamController = require('../controller/teamController');
const { s3Client } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', upload.single('logo'), uploadToPublicBucket, teamController.createTeam);
router.put('/:id', upload.single('logo'), uploadToPublicBucket, teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
