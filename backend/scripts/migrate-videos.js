/**
 * Migration script to move videos from S3 to Cloud Storage.
 */
require("dotenv").config({
    path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const Video = require("../model/video.model");
const { uploadToVideoUploads } = require("../middleware/cloudStorageUploader");

const dbURI =
    process.env.MONGO_URL ||
    "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

async function run() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to DB");

        // Initialize S3 Client (it will automatically use AWS CLI credentials)
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || "ap-south-1",
        });

        // Fetch all video records
        const videos = await Video.find({});

        if (!videos?.length) {
            console.log("No videos found. Exiting.");
            return process.exit(0);
        }

        console.log(
            `Found ${videos.length} videos. Processing...`,
        );

        // Iterate over each video sequentially
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];

            console.log(`[${i}] Processing video ${video.originalName || video._id}: ${video.path}`);

            // Skip if the path is empty, already a URL or seems like cloud storage ID instead of S3 key
            if (!video.path) {
                console.log(`[${i}] Video path is empty, skipping...`);
                continue;
            }

            let s3Response;
            try {
                let s3Key = video.path;
                if (s3Key.startsWith("http")) {
                    try {
                        const parsedUrl = new URL(s3Key);
                        s3Key = parsedUrl.pathname.replace(/^\/+/, ''); // Remove leading slash
                    } catch (e) {
                        console.log(`[${i}] Invalid URL in path, skipping...`);
                        continue;
                    }
                }

                const command = new GetObjectCommand({
                    Bucket: "brpl-uploads",
                    Key: s3Key,
                });
                s3Response = await s3Client.send(command);
            } catch (err) {
                console.log('Failed to download', err.message)
                continue;
            }

            const buffer = await streamToBuffer(s3Response.Body);
            const mimetype = s3Response.ContentType || "video/mp4";

            const req = {
                file: {
                    buffer: buffer,
                    mimetype: mimetype,
                    originalname: video.originalName || video.filename || "video.mp4",
                    size: buffer.length,
                },
            };

            let uploadError = null;
            const res = {
                status: () => ({
                    json: (data) => {
                        uploadError = data;
                        return;
                    },
                }),
            };

            let nextCalled = false;
            const next = () => {
                nextCalled = true;
            };

            try {
                // Call the existing function
                await uploadToVideoUploads(req, res, next);
            } catch (err) {
                uploadError = err.message;
            }

            if (uploadError || !nextCalled) {
                console.error(
                    `[${i}] Failed to upload ${video.originalName || video._id} to new storage:`,
                    uploadError || "Next not called.",
                );
                continue;
            }

            // 3. Update the current item's path with returned url
            if (req.file && req.file.location) {
                const newUrl = req.file.location;
                console.log(`[${i}] Uploaded successfully. New URL: ${newUrl}`);

                // 4. Immediately update that record into database directly via atomic operation
                await Video.updateOne(
                    { _id: video._id },
                    { $set: { path: newUrl } },
                );
                console.log(
                    `[${i}] Database updated successfully for ${video.originalName || video._id}.`,
                );
            } else {
                console.error(
                    `[${i}] Upload succeeded but failed to extract location URL from req.file`,
                );
            }
        }

        console.log("Migration finished.");
        await mongoose.disconnect();
        process.exit(0);
    } catch (e) {
        console.error("Fatal error during migration:", e);
        process.exit(1);
    }
}

run();
