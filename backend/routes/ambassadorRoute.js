const express = require('express');
const router = express.Router();
const ambassadorController = require('../controller/ambassadorController');
const { s3Client } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');

const storage = multerS3({
    s3: s3Client,
    bucket: 'brpl-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        cb(null, `ambassadors/${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.get('/', ambassadorController.getAllAmbassadors);
router.get('/:id', ambassadorController.getAmbassadorById);
router.post('/', upload.single('image'), ambassadorController.createAmbassador);
router.put('/:id', upload.single('image'), ambassadorController.updateAmbassador);
router.delete('/:id', ambassadorController.deleteAmbassador);

module.exports = router;
