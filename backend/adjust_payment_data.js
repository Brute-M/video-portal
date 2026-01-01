const mongoose = require('mongoose');
const User = require('./model/user.model');
const Video = require('./model/video.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function adjustPaymentData() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for data adjustment");

        const userId = "694a4bee242375673553c1c8";

        // 1. Update User: Keep isPaid=true, REMOVE paymentAmount and paymentId
        // The user said: "user table show only isPaid:true"
        const userUpdate = await User.findByIdAndUpdate(
            userId,
            {
                $set: { isPaid: true },
                $unset: { paymentAmount: "", paymentId: "" }
            },
            { new: true }
        );

        if (userUpdate) {
            console.log("User updated. New Data:", {
                id: userUpdate._id,
                email: userUpdate.email,
                isPaid: userUpdate.isPaid,
                paymentAmount: userUpdate.paymentAmount, // Should be undefined
                paymentId: userUpdate.paymentId          // Should be undefined
            });
        } else {
            console.log("User not found!");
        }

        // 2. Ensure Video has the amount and paymentId
        const videoUpdate = await Video.updateMany(
            { userId: userId },
            {
                $set: {
                    status: 'completed',
                    amount: 1499,
                    paymentId: "600184397466"
                }
            }
        );

        console.log(`Video(s) ensured. Matched: ${videoUpdate.matchedCount}, Modified: ${videoUpdate.modifiedCount}`);

    } catch (err) {
        console.error("Error executing adjustment:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

adjustPaymentData();
