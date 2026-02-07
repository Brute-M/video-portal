const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function verifyPassword() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const mobile = "8630691807";
        const passwordAttempt = "nahush@123";

        const user = await User.findOne({ mobile });

        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }

        console.log("User found:", user.email);
        console.log("Stored Hash:", user.password);

        const isMatch = await bcrypt.compare(passwordAttempt, user.password);

        console.log(`Password '${passwordAttempt}' match result:`, isMatch);

        process.exit(0);
    } catch (err) {
        console.error("Error verifying password:", err);
        process.exit(1);
    }
}

verifyPassword();
