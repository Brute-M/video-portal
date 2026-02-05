const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function createWilsonUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for user creation");

        const email = "sahotawilson150@gmail.com";
        const passwordPlain = "wilson123"; // Setting a default simple password

        // Extracted from image: +91 9517 721237
        const mobile = "9517721237";

        const fname = "Wilson";
        const lname = "Masih";
        const playerRole = "All-Rounder";

        console.log(`Checking if user exists: ${email}`);

        let user = await User.findOne({ email: email.toLowerCase() });

        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        if (user) {
            console.log(`User already exists: ${user.email}. Updating details...`);

            user.password = hashedPassword;
            user.fname = fname;
            user.lname = lname;
            user.mobile = mobile;
            user.playerRole = playerRole;
            user.isPaid = true;
            user.isFromLandingPage = true;
            user.paymentAmount = 1499;
            user.paymentId = "pay_S7akdPJytNT7m3"; // Fetched from provided image

            // Ensure required fields
            if (!user.city) user.city = "Unknown";
            if (!user.state) user.state = "Unknown";

            await user.save();
            console.log("User UPDATED successfully.");

        } else {
            console.log("User not found. Creating NEW user...");

            user = new User({
                fname: fname,
                lname: lname,
                email: email.toLowerCase(),
                password: hashedPassword,
                mobile: mobile,
                playerRole: playerRole,
                city: "Unknown", // Required field placeholder
                state: "Unknown", // Required field placeholder
                isPaid: true,
                paymentAmount: 1499,
                paymentId: "pay_S7akdPJytNT7m3", // Fetched from provided image
                isFromLandingPage: true,
                conversionType: 'manual_creation'
            });

            await user.save();
            console.log("User CREATED successfully.");
        }

        console.log("Final User Data:", {
            id: user._id,
            name: `${user.fname} ${user.lname}`,
            email: user.email,
            role: user.playerRole,
            isPaid: user.isPaid,
            paymentId: user.paymentId
        });

    } catch (err) {
        console.error("Error creating/updating user:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

createWilsonUser();
