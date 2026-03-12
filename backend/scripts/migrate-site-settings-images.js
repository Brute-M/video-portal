/**
 * Migration script to move socialLink images from S3 to Cloud Storage.
 */
require("dotenv").config({
    path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const axios = require("axios");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const SiteSettings = require("../model/siteSettings.model");
const { uploadToPublicBucket } = require("../middleware/cloudStorageUploader");

const dbURI =
    process.env.MONGO_URL ||
    "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl-development";


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

        const settings = await SiteSettings.findOne({ key: "main" });
        let activeSettings = settings;

        if (!activeSettings) {
            console.log('No key="main" settings found. Checking without key...');
            activeSettings = await SiteSettings.findOne({});
            if (!activeSettings) {
                console.log("No settings found. Exiting.");
                return process.exit(0);
            }
        }

        if (
            !activeSettings.socialLinks ||
            activeSettings.socialLinks.length === 0
        ) {
            console.log("No social links to process. Exiting.");
            return process.exit(0);
        }

        console.log(
            `Found ${activeSettings.socialLinks.length} social links. Processing...`,
        );

        // Iterate over each socialLink sequentially
        for (let i = 0; i < activeSettings.socialLinks.length; i++) {
            const link = activeSettings.socialLinks[i];

            console.log(`[${i}] Processing ${link.name || "unnamed"}: ${link.image}`);

            let s3Response;
            try {
                const command = new GetObjectCommand({
                    Bucket: "brpl-uploads",
                    Key: link.image,
                });
                s3Response = await s3Client.send(command);
            } catch (err) {
                console.log('FAiled to download', err.message)

                continue;
            }

            const buffer = await streamToBuffer(s3Response.Body);
            const mimetype = s3Response.ContentType || "image/jpeg";


            const req = {
                file: {
                    buffer: buffer,
                    mimetype: mimetype,
                    originalname: link.name,
                    size: buffer.length,
                },
            };

            let uploadError = null;
            const res = {
                status: (code) => ({
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
                await uploadToPublicBucket(req, res, next);
            } catch (err) {
                uploadError = err.message;
            }

            if (uploadError || !nextCalled) {
                console.error(
                    `[${i}] Failed to upload ${link.name || "unnamed"} to new storage:`,
                    uploadError || "Next not called.",
                );
                continue;
            }

            // 3. Update the current item's image with returned url
            if (req.file && req.file.location) {
                const newUrl = req.file.location;
                console.log(`[${i}] Uploaded successfully. New URL: ${newUrl}`);

                // 4. Immediately update that record into database directly via atomic operation
                await SiteSettings.updateOne(
                    { _id: activeSettings._id },
                    { $set: { [`socialLinks.${i}.image`]: newUrl } },
                );
                console.log(
                    `[${i}] Database updated successfully for ${link.name || "unnamed"}.`,
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
