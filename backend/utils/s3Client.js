const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const s3Client = new S3Client({
    region: 'ap-south-1' // ap-south-1
});

const deleteFromS3 = async (key) => {
    try {
        const deleteParams = {
            Bucket: 'brpl-uploads',
            Key: key
        };
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log(`Deleted S3 object: ${key}`);
        return true;
    } catch (error) {
        console.error("S3 Deletion Error:", error);
        throw error;
    }
};

const getPresignedUrl = async (key, options = {}) => {
    try {
        const command = new GetObjectCommand({
            Bucket: 'brpl-uploads',
            Key: key,
            ...options
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error("Presigned URL Error:", error);
        return null;
    }
};

/**
 * Resolve image value from DB to URL for API response.
 * - S3 key (e.g. cms/..., site/..., our-team/...) -> presigned URL
 * - Already http(s) -> return as-is
 * - uploads/... (legacy local) -> return as-is (frontend prepends API URL)
 */
const resolveImageUrl = async (value) => {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('uploads/') || value.startsWith('/')) return value;
    const url = await getPresignedUrl(value);
    return url || value;
};

module.exports = { s3Client, deleteFromS3, getPresignedUrl, resolveImageUrl };