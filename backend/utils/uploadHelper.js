const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('./s3Client');

const BUCKET = 'brpl-uploads';

/**
 * Create multer upload middleware that uploads to S3 with the given key prefix.
 * @param {string} prefix - S3 key prefix (e.g. 'cms/banners', 'cms/who-we-are', 'our-team', 'site/banner')
 * @param {object} options - { limits, fileFilter }
 * @returns multer instance
 */
function createS3Upload(prefix, options = {}) {
    const storage = multerS3({
        s3: s3Client,
        bucket: BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const ext = (file.originalname && file.originalname.includes('.'))
                ? file.originalname.slice(file.originalname.lastIndexOf('.'))
                : '';
            cb(null, `${prefix}/${Date.now()}${ext}`);
        }
    });
    return multer({
        storage,
        limits: options.limits || { fileSize: 10 * 1024 * 1024 },
        fileFilter: options.fileFilter || ((req, file, cb) => {
            if (file.mimetype.startsWith('image/')) cb(null, true);
            else cb(new Error('Only images are allowed'));
        })
    });
}

module.exports = { createS3Upload, BUCKET };
