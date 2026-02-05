const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateNeilPassword() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "Patel.neil86@yahoo.in";
        const newPassword = "123456";

        console.log(`Searching for user with email: ${email}`);
        const user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log(`User found: ${user.email} (${user._id})`);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
            console.log("Password updated successfully to '123456'");
        } else {
            console.log("User not found!");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error updating password:", err);
        process.exit(1);
    }
}

updateNeilPassword();
