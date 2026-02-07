const mongoose = require('mongoose');
const User = require('./model/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbURI = "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

async function processUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const userData = {
            email: "Navum007@gmail.com",
            fname: "Navam",
            password: "Navdeep@55",
            playerRole: "All-Rounder",
            state: "Delhi",
            city: "Gurugram",
            isPaid: true,
            isFromLandingPage: true,
            paymentAmount: 1499,
            paymentId: "pay_SCYj5qJtyyVkXu",
            mobile: "9999999999" // Placeholder if creating new
        };

        // Case insensitive email search
        let user = await User.findOne({ email: { $regex: new RegExp(`^${userData.email}$`, 'i') } });

        if (user) {
            console.log(`User found: ${user.email} (ID: ${user._id}). Updating record...`);

            // Update fields
            user.fname = userData.fname;
            user.playerRole = userData.playerRole;
            user.state = userData.state;
            user.city = userData.city;
            user.isPaid = userData.isPaid;
            user.isFromLandingPage = userData.isFromLandingPage;
            user.paymentAmount = userData.paymentAmount;
            user.paymentId = userData.paymentId;

            // Update password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(userData.password, salt);

            await user.save();
            console.log("User updated successfully:", user);
        } else {
            console.log(`User not found. Creating new record for ${userData.email}...`);

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const newUser = new User({
                email: userData.email.toLowerCase(), // Store lowercase
                fname: userData.fname,
                password: hashedPassword,
                mobile: userData.mobile,
                playerRole: userData.playerRole,
                state: userData.state,
                city: userData.city,
                isPaid: userData.isPaid,
                isFromLandingPage: userData.isFromLandingPage,
                paymentAmount: userData.paymentAmount,
                paymentId: userData.paymentId
            });

            await newUser.save();
            console.log("New user created successfully:", newUser);
        }

    } catch (error) {
        console.error("Error processing user:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

processUser();
