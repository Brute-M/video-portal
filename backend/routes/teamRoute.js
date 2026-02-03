const express = require('express');
const router = express.Router();
const teamController = require('../controller/teamController');
const { s3Client } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');

const storage = multerS3({
    s3: s3Client,
    bucket: 'brpl-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        cb(null, `teams/${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', upload.single('logo'), teamController.createTeam);
router.put('/:id', upload.single('logo'), teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
