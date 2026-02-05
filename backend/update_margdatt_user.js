const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateMargdattUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "margdatt4320@gmail.com";

        console.log(`Searching for user with email: ${email}`);

        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log(`User found: ${user.email} (${user._id})`);
            console.log("Updating user details...");

            user.isPaid = true;
            user.paymentAmount = 1499;
            user.paymentId = "698736427904";

            // The user didn't explicitly ask for this, but standard procedure in previous tasks was to set this. 
            // However, sticking to explicit requests is safer.
            // user.isFromLandingPage = true; 

            await user.save();
            console.log("User updated successfully!");
        } else {
            console.log("User not found!");
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating user:", err);
        process.exit(1);
    }
}

updateMargdattUser();
