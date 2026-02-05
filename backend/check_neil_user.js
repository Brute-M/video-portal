const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function checkNeil() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const users = await User.find({ email: { $regex: 'neil', $options: 'i' } });

        console.log(`Found ${users.length} users matching 'neil':`);
        users.forEach(u => {
            console.log(JSON.stringify(u, null, 2));
        });

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkNeil();
