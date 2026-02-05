const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

// Using the URI found in server.js and other scripts
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateAbhishekUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for update");

        const userEmail = "royashoke029@gmail.com";

        // Find user by email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User with email ${userEmail} NOT FOUND.`);
            return;
        }

        console.log("Found User:", user.fname, user.lname, user.email);

        const updateData = {
            isPaid: true,
            paymentAmount: 1499,
            paymentId: "T2602021838493749224920",
            isFromLandingPage: true
        };

        const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });

        console.log("User updated successfully. New Data:", {
            id: result._id,
            email: result.email,
            isPaid: result.isPaid,
            paymentAmount: result.paymentAmount,
            paymentId: result.paymentId,
            isFromLandingPage: result.isFromLandingPage
        });

    } catch (err) {
        console.error("Error executing update:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

updateAbhishekUser();
