const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function checkDuplicates() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "archnaprashadward34@gmail.com";
        const mobile = "8630691807";

        const users = await User.find({
            $or: [{ email }, { mobile }]
        });

        console.log(`Found ${users.length} user(s).`);

        users.forEach((u, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log("ID:", u._id);
            console.log("Email:", u.email);
            console.log("Mobile:", u.mobile);
            console.log("Password Hash:", u.password);
        });

        process.exit(0);
    } catch (err) {
        console.error("Error checking users:", err);
        process.exit(1);
    }
}

checkDuplicates();
