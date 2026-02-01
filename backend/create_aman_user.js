const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

// Using the URI from fix_aviraj_user.js
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function createAmanUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "amansh262@gmail.com";
        const passwordPlain = "123456";
        const mobile = "9999999999"; // Placeholder
        const fname = "Aman";
        const lname = "Sharma";

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
            user.isPaid = true;
            user.isFromLandingPage = true;
            user.paymentAmount = 1499;
            user.paymentId = "T2601240944279469972088";

            // Ensure fields are clean
            if (!user.city) user.city = "Unknown";
            if (!user.state) user.state = "Unknown";

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
                city: "Unknown",
                state: "Unknown",
                isPaid: true,
                paymentAmount: 1499,
                paymentId: "T2601240944279469972088",
                isFromLandingPage: true,
                conversionType: 'none'
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

createAmanUser();
