const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function createNeilUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "Patel.neil86@yahoo.in";
        const passwordPlain = "123456";
        const mobile = "9427163341";
        const fname = "Neil Pramodbhai";
        const lname = "Patel";
        const city = "Surat";
        const state = "Gujarat";
        const playerRole = "All rounder";
        const paymentId = "pay_S6pv5WXNBpts0U";

        console.log(`Searching for user with email: ${email}`);

        let user = await User.findOne({ email: email.toLowerCase() });

        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        if (user) {
            console.log(`User found: ${user.email} (${user._id})`);
            console.log("Updating user details...");

            user.password = hashedPassword;
            user.fname = fname;
            user.lname = lname;
            user.email = email.toLowerCase();
            user.mobile = mobile;
            user.city = city;
            user.state = state;
            user.playerRole = playerRole;
            user.isPaid = true;
            user.isFromLandingPage = true;
            user.paymentAmount = 1499;
            user.paymentId = paymentId;

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
                paymentId: paymentId,
                isFromLandingPage: true,
                conversionType: 'manual'
            });

            await user.save();
            console.log("User created successfully!");
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating/updating user:", err);
        process.exit(1);
    }
}

createNeilUser();
