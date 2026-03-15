const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

const performSingleUpload = async (bucketId, file, token) => {
    const CLOUD_STORAGE_SERVER_URL = process.env.CLOUD_STORAGE_SERVER_URL;
    const formData = new FormData();

    formData.append('file', file.buffer, {
        filename: uuidv4(),
        contentType: file.mimetype
    });

    formData.append('name', Date.now() + '_' + file.originalname);
    formData.append('type', file.mimetype);
    formData.append('size', file.size.toString());

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

    return {
        cloudStorageResponse: fileData,
        file: {
            fieldname: file.fieldname,
            key: fileData?._id,
            location: fileData?.dataUrl,
            originalname: fileData?.name,
            size: fileData?.size
        }
    };
};

const handleSingleUpload = async (bucketId, req, token) => {
    const result = await performSingleUpload(bucketId, req.file, token);
    req.cloudStorageResponse = result.cloudStorageResponse;
    req.file = {
        key: result.file.key,
        location: result.file.location,
        originalname: result.file.originalname,
        size: result.file.size
    };
};

const handleMultipleUploads = async (bucketId, req, token) => {
    req.cloudStorageResponses = [];

    /* for .array() */
    if (Array.isArray(req.files)) {
        const uploadPromises = req.files.map(async (file, index) => {
            const result = await performSingleUpload(bucketId, file, token);
            req.cloudStorageResponses.push(result.cloudStorageResponse);
            req.files[index] = {
                fieldname: result.file.fieldname,
                key: result.file.key,
                location: result.file.location,
                originalname: result.file.originalname,
                size: result.file.size
            };
        });
        await Promise.all(uploadPromises);
    } else if (typeof req.files === 'object') { /* for .fields() */
        const uploadPromises = [];
        for (const key in req.files) {
            req.files[key].forEach((file, index) => {
                uploadPromises.push(
                    performSingleUpload(bucketId, file, token).then(result => {
                        req.cloudStorageResponses.push(result.cloudStorageResponse);
                        req.files[key][index] = {
                            fieldname: result.file.fieldname,
                            key: result.file.key,
                            location: result.file.location,
                            originalname: result.file.originalname,
                            size: result.file.size
                        };
                    })
                );
            });
        }
        await Promise.all(uploadPromises);
    }
};

const uploadToCloudStorage = (bucketId) => async (req, res, next) => {
    try {
        const hasFile = req.file;
        const hasFiles = req.files && (
            (Array.isArray(req.files) && req.files.length > 0) ||
            (!Array.isArray(req.files) && typeof req.files === 'object' && Object.keys(req.files).length > 0)
        );

        if (!hasFile && !hasFiles) {
            return next();
        }

        const token = await getCloudStoreToken();

        if (hasFile) {
            await handleSingleUpload(bucketId, req, token);
        }

        if (hasFiles) {
            await handleMultipleUploads(bucketId, req, token);
        }

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