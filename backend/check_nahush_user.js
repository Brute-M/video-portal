const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function checkNahushUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        // Search by mobile since email might have been updated or not if unique constraint failed (though catch would handle that)
        // or search by ID if I had it, but searching by mobile is safe as it was the constant factor.
        const mobile = "8630691807";

        const user = await User.findOne({ mobile });

        if (user) {
            console.log("User found:");
            console.log("ID:", user._id);
            console.log("Email:", user.email); // Check if email updated correctly
            console.log("Fname:", user.fname);
            console.log("Lname:", user.lname);
            console.log("Mobile:", user.mobile);
            console.log("IsPaid:", user.isPaid);
            console.log("Password Hash:", user.password); // Just to see if it looks like a hash
            console.log("CreatedAt:", user.createdAt);
            console.log("UpdatedAt:", user.updatedAt);
        } else {
            console.log("User not found with mobile:", mobile);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error checking user:", err);
        process.exit(1);
    }
}

checkNahushUser();
