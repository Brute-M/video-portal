const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

async function updateAdityaRecord() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const targetEmail = "adityawaghela3@gmail.com";

        // Use the ID from the screenshot if available, or search by email
        // Screenshot ID: 6985c26c9ba906ba0f0fdb86 (This looks like a hex string, but standard ObjectIds are 24 hex chars. 
        // 6985c26c9ba906ba0f0fdb86 is 24 chars? 
        // "6985c26c9ba906ba0f0fdb86".length is 24. Wait.
        // 6985... is 24 chars. Let's verify.
        // 123456789012345678901234
        // 6985c26c9ba906ba0f0fdb86. 
        // Yes, it looks like a valid ObjectId.

        const userId = "6985c26c9ba906ba0f0fdb86";

        let user = await User.findById(userId);
        if (!user) {
            console.log(`User with ID ${userId} not found, searching by email ${targetEmail}...`);
            user = await User.findOne({ email: targetEmail });
        }

        if (!user) {
            console.error("User not found!");
            return;
        }

        console.log(`Updating record for: ${user.fname} ${user.lname} (${user.email})`);

        const updateData = {
            isPaid: true,
            isFromLandingPage: true, // Assuming this should be true based on context
            paymentId: "pay_SCpSrDjE6LaKjY",
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

updateAdityaRecord();
