const mongoose = require('mongoose');
const User = require('./model/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updateLakshmiPassword() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for update");

        const userEmail = "sai965277@gmail.com";
        const newPasswordPlain = "211105";

        // Find user by email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User with email ${userEmail} NOT FOUND.`);
            return;
        }

        console.log("Found User:", user.fname, user.lname, user.email);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);
        console.log("Password hashed.");

        const updateData = {
            password: hashedPassword
        };

        const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });

        console.log("User updated successfully. New Data:", {
            id: result._id,
            email: result.email,
            password: result.password // Hashed
        });

    } catch (err) {
        console.error("Error executing update:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

updateLakshmiPassword();
