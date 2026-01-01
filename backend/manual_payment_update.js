const mongoose = require('mongoose');
const User = require('./model/user.model');
require('dotenv').config();

// Using the URI found in server.js
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function updatePayment() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for manual update");

        const userId = "694a4bee242375673553c1c8";

        // Check if user exists first
        const user = await User.findById(userId);
        if (!user) {
            console.log(`User with ID ${userId} NOT FOUND. Checking if ID is valid...`);
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.log("Provided ID is NOT a valid MongoDB ObjectId format.");
            }
            return;
        }

        console.log("Found User:", user.email, user.fname);

        const updateData = {
            isPaid: true,
            paymentAmount: 1499,
            paymentId: "600184397466" // UPI Transaction ID
        };

        const result = await User.findByIdAndUpdate(userId, updateData, { new: true });

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

updatePayment();
