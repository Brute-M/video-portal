const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updatePrashantUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for update");

        const userEmail = "prashantkuchabnadiya@gmail.com";

        // Find user by email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.log(`User with email ${userEmail} NOT FOUND.`);
            return;
        }

        console.log("Found User:", user.fname, user.lname, user.email);

        const updateData = {
            isPaid: true,
            paymentAmount: 1499,
            paymentId: "T2602040805522967875542"
        };

        const result = await User.findByIdAndUpdate(user._id, updateData, { new: true });

        console.log("User updated successfully. New Data:", {
            id: result._id,
            email: result.email,
            isPaid: result.isPaid,
            paymentAmount: result.paymentAmount,
            paymentId: result.paymentId
        });

    } catch (err) {
        console.error("Error executing update:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

updatePrashantUser();
