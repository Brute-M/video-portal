const express = require('express');
const router = express.Router();
const tourTeamController = require('../controller/ourTeamController');
const authenticate = require('../middleware/authMiddleware');

const { uploadToPublicBucket } = require('../middleware/cloudStorageUploader');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

router.post('/', authenticate, upload.single('image'), uploadToPublicBucket, tourTeamController.createMember);
router.get('/', tourTeamController.getAllMembers);
router.get('/:id', tourTeamController.getMemberById);
router.put('/:id', authenticate, upload.single('image'), uploadToPublicBucket, tourTeamController.updateMember);
router.delete('/:id', authenticate, tourTeamController.deleteMember);

module.exports = router;
