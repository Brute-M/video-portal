const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function inspectEmail() {
    try {
        await mongoose.connect(dbURI);
        const mobile = "8630691807";
        const user = await User.findOne({ mobile });

        if (user) {
            console.log("Email:", user.email);
            console.log("Char codes:");
            for (let i = 0; i < user.email.length; i++) {
                console.log(`${user.email[i]}: ${user.email.charCodeAt(i)}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectEmail();
