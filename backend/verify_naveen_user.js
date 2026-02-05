const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function verifyNaveenUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for verification");

        const userEmail = "naveenkumarbasu01@gmail.com";
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log("User NOT FOUND.");
        } else {
            console.log("\n--- User Record Verification ---");
            console.log("Name:", user.fname, user.lname);
            console.log("Email:", user.email);
            console.log("Payment Amount:", user.paymentAmount);
            console.log("Payment ID:", user.paymentId);
            console.log("Is Paid:", user.isPaid);
            console.log("--------------------------------\n");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyNaveenUser();
