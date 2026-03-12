/**
 * Migration script to move event images from S3 to Cloud Storage.
 */
require("dotenv").config({
    path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const Event = require("../model/event.model");
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

        // Fetch all event records
        const events = await Event.find({});

        if (!events?.length) {
            console.log("No events found. Exiting.");
            return process.exit(0);
        }

        console.log(`Found ${events.length} events. Processing...`);

        // Iterate over each event using forEach
        const promises = [];
        events.forEach((event, i) => {
            const uploadTask = (async () => {
                const eventTitle = event.title || event._id.toString();

                console.log(`\n[${i}] --- START: Processing event "${eventTitle}" ---`);
                console.log(`[${i}] INFO: Current image path: ${event.image}`);

                // Skip if the path is empty
                if (!event.image) {
                    console.log(`[${i}] SKIP: Image path is empty for event "${eventTitle}".`);
                    return;
                }

                let s3Response;
                try {
                    let s3Key = event.image;
                    if (s3Key.startsWith("http")) {
                        try {
                            const parsedUrl = new URL(s3Key);
                            s3Key = parsedUrl.pathname.replace(/^\/+/, ''); // Remove leading slash
                        } catch (e) {
                            console.log(`[${i}] SKIP: Invalid URL in image path for event "${eventTitle}".`);
                            return;
                        }
                    }

                    console.log(`[${i}] S3 FETCH: Downloading "${s3Key}" from S3 bucket...`);
                    const command = new GetObjectCommand({
                        Bucket: "brpl-uploads",
                        Key: s3Key,
                    });
                    s3Response = await s3Client.send(command);
                    console.log(`[${i}] S3 SUCCESS: Downloaded "${s3Key}" successfully.`);
                } catch (err) {
                    console.log(`[${i}] S3 ERROR: Failed to download from S3 for event "${eventTitle}":`, err.message);
                    return;
                }

                const buffer = await streamToBuffer(s3Response.Body);
                const mimetype = s3Response.ContentType || "image/jpeg";

                console.log(`[${i}] BUFFER INFO: File read successfully. Size: ${buffer.length} bytes, Mimetype: ${mimetype}`);

                const req = {
                    file: {
                        buffer: buffer,
                        mimetype: mimetype,
                        originalname: eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".jpg",
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
                    console.log(`[${i}] UPLOAD: Uploading to Cloud Storage...`);
                    // Call the existing function
                    await uploadToPublicBucket(req, res, next);
                } catch (err) {
                    uploadError = err.message;
                }

                if (uploadError || !nextCalled) {
                    console.error(
                        `[${i}] UPLOAD ERROR: Failed to upload "${eventTitle}" to new storage:`,
                        uploadError || "Next not called."
                    );
                    return;
                }

                // 3. Update the current item's path with returned url
                if (req.file && req.file.location) {
                    const newUrl = req.file.location;
                    console.log(`[${i}] UPLOAD SUCCESS: New format URL obtained -> ${newUrl}`);

                    // 4. Immediately update that record into database directly via atomic operation
                    console.log(`[${i}] DB UPDATE: Updating database for event "${eventTitle}" with new image URL...`);
                    await Event.updateOne(
                        { _id: event._id },
                        { $set: { image: newUrl } },
                    );
                    console.log(
                        `[${i}] --- DONE: Migration completed successfully for event "${eventTitle}". ---`
                    );
                } else {
                    console.error(
                        `[${i}] ERROR: Upload succeeded but failed to extract location URL for "${eventTitle}".`
                    );
                }
            })();
            promises.push(uploadTask);
        });

        // Wait for all the parallel processes to finish completely
        await Promise.all(promises);

        console.log("\nMigration finished for all events.");
        await mongoose.disconnect();
        process.exit(0);
    } catch (e) {
        console.error("Fatal error during migration:", e);
        process.exit(1);
    }
}

run();
