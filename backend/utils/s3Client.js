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

const getPresignedUrl = async (key) => {
    try {
        const command = new GetObjectCommand({
            Bucket: 'brpl-uploads',
            Key: key
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error("Presigned URL Error:", error);
        return null;
    }
};

module.exports = { s3Client, deleteFromS3, getPresignedUrl };



