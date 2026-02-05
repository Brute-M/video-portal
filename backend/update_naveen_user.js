const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

// Using the URI found in server.js and other scripts
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateNaveenUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for update");

        const userEmail = "naveenkumarbasu01@gmail.com";

        // Find user by email
        let user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User with email ${userEmail} NOT FOUND. Creating new user if possible or just exiting.`);
            // If user doesn't exist, we might want to create it? 
            // The prompt says "update this user record", implying it exists or should be created.
            // But usually "update" implies existence. If it doesn't exist, I'll log it.
            // Previous requests were "create user", this says "update".
            // I'll assume update first.
             console.log("User not found, exiting.");
             return;
        }

        console.log("Found User:", user.fname, user.lname, user.email);

        const updateData = {
           fname: "Naveen",
           lname: "Kumar",
           mobile: "9666792061",
           playerRole: "Batsman",
           isPaid: true,
           paymentAmount: 1499,
           paymentId: "pay_SAZvQjHQB1X5FI",
           isFromLandingPage: true
        };

        const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });

        console.log("User updated successfully. New Data:", {
            id: result._id,
            email: result.email,
            fname: result.fname,
            lname: result.lname,
            mobile: result.mobile,
            playerRole: result.playerRole,
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

updateNaveenUser();
