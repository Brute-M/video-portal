const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

const uploadToCloudStorage = (bucketId) => async (req, res, next) => {
    const CLOUD_STORAGE_SERVER_URL = process.env.CLOUD_STORAGE_SERVER_URL;

    try {
        if (!req.file) {
            return res.status(400).json({
                statusCode: 400,
                data: { message: 'No file uploaded' }
            });
        }

        const formData = new FormData();

        formData.append('file', req.file.buffer, {
            filename: uuidv4(),
            contentType: req.file.mimetype
        });

        formData.append('name', Date.now() + '_' + req.file.originalname);
        formData.append('type', req.file.mimetype);
        formData.append('size', req.file.size.toString());

        const token = await getCloudStoreToken();

        const response = await axios.post(
            `${CLOUD_STORAGE_SERVER_URL}/api/buckets/${bucketId}/files`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const fileData = response?.data?.currentFile;

        req.cloudStorageResponse = fileData;

        req.file = {
            key: fileData?._id,
            location: fileData?.dataUrl,
            originalname: fileData?.name,
            size: fileData?.size
        };

        next();

    } catch (error) {
        console.error('Upload Error:', error?.response?.data || error.message);

        return res.status(500).json({
            statusCode: 500,
            data: { message: 'Error uploading to cloud storage' }
        });
    }
};

module.exports = uploadToCloudStorage;

const getCloudStoreToken = async () => {
    const CLOUD_STORAGE_SERVER_URL = process.env.CLOUD_STORAGE_SERVER_URL;
    const CLOUD_STORAGE_ADMIN_USERNAME = process.env.CLOUD_STORAGE_ADMIN_USERNAME;
    const CLOUD_STORAGE_ADMIN_PASSWORD = process.env.CLOUD_STORAGE_ADMIN_PASSWORD;

    try {
        const response = await axios.post(
            `${CLOUD_STORAGE_SERVER_URL}/api/auth/login`,
            {
                email: CLOUD_STORAGE_ADMIN_USERNAME,
                password: CLOUD_STORAGE_ADMIN_PASSWORD
            }
        );

        return response.data?.token;

    } catch (error) {
        console.error(
            'Token Error:',
            error?.response?.data || error.message
        );
        throw new Error('Unable to fetch file server token');
    }
};

const uploadToVideoUploads = uploadToCloudStorage(
    process.env.CLOUD_STORAGE_VIDEO_UPLOADS_BUCKET_ID
);

const uploadToPublicBucket = uploadToCloudStorage(
    process.env.CLOUD_STORAGE_PUBLIC_BUCKET_ID
);

module.exports = { uploadToVideoUploads, uploadToPublicBucket };