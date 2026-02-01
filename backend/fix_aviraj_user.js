const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

// Using the URI found in create_aviraj_user.js
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function fixUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "avirajpawar75@gmail.com";
        const passwordPlain = "password-aviraj@123";
        const mobile = "9552371517";

        console.log(`Searching for user with email: ${email} or mobile: ${mobile}`);

        let user = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { mobile: mobile }]
        });

        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        if (user) {
            console.log(`User found: ${user.email} (${user._id})`);
            console.log("Updating user details...");

            user.password = hashedPassword;
            user.fname = "Aviraj";
            user.lname = "Pawar";
            user.email = email.toLowerCase();
            user.mobile = mobile;
            user.isPaid = true;
            user.isFromLandingPage = true;
            user.paymentAmount = 1499;
            user.paymentId = "602602074459";

            // Ensure fields are clean
            if (!user.city) user.city = "UNKNOWN";
            if (!user.state) user.state = "UNKNOWN";

            await user.save();
            console.log("User updated successfully!");
        } else {
            console.log("User not found. Creating new user...");

            user = new User({
                fname: "Aviraj",
                lname: "Pawar",
                email: email.toLowerCase(),
                password: hashedPassword,
                mobile: mobile,
                city: "UNKNOWN",
                state: "UNKNOWN",
                isPaid: true,
                paymentAmount: 1499,
                paymentId: "602602074459",
                isFromLandingPage: true,
                conversionType: 'none'
            });

            await user.save();
            console.log("User created successfully!");
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error fixing user:", err);
        process.exit(1);
    }
}

fixUser();
