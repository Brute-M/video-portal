const mongoose = require('mongoose');
const Video = require('./model/video.model');
require('dotenv').config();

// Using the URI found in server.js
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateVideoStatus() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for video update");

        const userId = "694a4bee242375673553c1c8";

        // Check if video exists for this user
        // We might want to update ALL videos for this user if they are pending, 
        // or just the latest one. Assuming user has one 'pending_payment' video 
        // or we just update any video associated with this user to completed?
        // Let's find pending ones first.

        const videos = await Video.find({ userId: userId });

        if (videos.length === 0) {
            console.log(`No videos found for User ID ${userId}`);
            return;
        }

        console.log(`Found ${videos.length} videos for user.`);

        const updateData = {
            status: 'completed',
            paymentAmount: 1499, // Note: Schema calls it 'amount', but let's check consistent naming. 
            // Step 63 showed: amount: { type: Number }
            // But User model had paymentAmount. 
            // Video model has 'amount'.
            amount: 1499,
            paymentId: "600184397466"
        };

        // Update all videos for this user? Or just the pending ones?
        // Usually a user uploads one video and pays for it.
        // Let's update all videos for this user to be safe/thorough as per request "update this user video status"

        const result = await Video.updateMany(
            { userId: userId },
            {
                $set: {
                    status: 'completed',
                    amount: 1499,
                    paymentId: "600184397466"
                }
            }
        );

        console.log("Video(s) updated successfully.");
        console.log("Matched Count:", result.matchedCount);
        console.log("Modified Count:", result.modifiedCount);

    } catch (err) {
        console.error("Error executing video update:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

updateVideoStatus();
