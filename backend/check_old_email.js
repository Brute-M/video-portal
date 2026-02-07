const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function checkOldEmail() {
    try {
        await mongoose.connect(dbURI);
        const email = "nahushsharma100@gmail.com";
        const user = await User.findOne({ email });
        if (user) {
            console.log("Found user with old email:", email);
            console.log("ID:", user._id);
        } else {
            console.log("No user found with email:", email);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOldEmail();
