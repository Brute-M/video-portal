const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateShivamRecord() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const userId = "695bb606ee1a03b48eafd6b3";
        const email = "choudhary.shivam61@gmail.com";

        // Find user by ID or Email to be safe
        let user = await User.findById(userId);
        if (!user) {
            console.log(`User with ID ${userId} not found, searching by email...`);
            user = await User.findOne({ email: email });
        }

        if (!user) {
            console.error("User not found!");
            return;
        }

        console.log(`Updating record for: ${user.fname} ${user.lname} (${user.email})`);

        const updateData = {
            isPaid: true,
            isFromLandingPage: true,
            paymentId: "696856856726",
            paymentAmount: 1499
        };

        const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true });

        console.log("Update successful!");
        console.log("Updated Fields:", {
            id: updatedUser._id,
            email: updatedUser.email,
            isPaid: updatedUser.isPaid,
            isFromLandingPage: updatedUser.isFromLandingPage,
            paymentId: updatedUser.paymentId,
            paymentAmount: updatedUser.paymentAmount
        });

    } catch (error) {
        console.error("Error updating record:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

updateShivamRecord();
