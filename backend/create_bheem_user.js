const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function createBheemUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "bheemyadav1995@gmail.com";
        const passwordPlain = "123456";
        const mobile = "8130327482";
        const fname = "Bheem";
        const lname = "Yadav";
        const city = "Ghaziabad";
        const state = "Uttar Pradesh";
        const playerRole = "All-Rounder";

        console.log(`Searching for user with email: ${email}`);

        let user = await User.findOne({ email: email.toLowerCase() });

        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        if (user) {
            console.log(`User found: ${user.email} (${user._id})`);
            console.log("Updating user details...");

            user.password = hashedPassword;
            user.fname = fname;
            user.lname = lname;
            user.mobile = mobile;
            user.city = city;
            user.state = state;
            user.playerRole = playerRole;
            user.isPaid = true;
            user.isFromLandingPage = true;
            user.paymentAmount = 1499;
            user.paymentId = "698239168582";

            await user.save();
            console.log("User updated successfully!");
        } else {
            console.log("User not found. Creating new user...");

            user = new User({
                fname: fname,
                lname: lname,
                email: email.toLowerCase(),
                password: hashedPassword,
                mobile: mobile,
                city: city,
                state: state,
                playerRole: playerRole,
                isPaid: true,
                paymentAmount: 1499,
                paymentId: "698239168582",
                isFromLandingPage: true,
                conversionType: 'none'
            });

            await user.save();
            console.log("User created successfully!");
        }

        console.log("Details:");
        console.log(`Name: ${user.fname} ${user.lname}`);
        console.log(`Email: ${user.email}`);
        console.log(`Mobile: ${user.mobile}`);
        console.log(`Role: ${user.playerRole}`);
        console.log(`Location: ${user.city}, ${user.state}`);
        console.log(`Payment: ${user.isPaid} (${user.paymentAmount}) - ${user.paymentId}`);

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating/updating user:", err);
        process.exit(1);
    }
}

createBheemUser();
