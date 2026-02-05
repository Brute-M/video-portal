const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateAnilUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for update");

        const userEmail = "anilkmrchaudhary@gmail.com";

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
            // Payment ID was not clearly visible in the email screenshot provided.
            // Using a placeholder to ensure the record is marked as paid.
            paymentId: "CONFIRMED_BY_EMAIL_SCREENSHOT",
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

updateAnilUser();
