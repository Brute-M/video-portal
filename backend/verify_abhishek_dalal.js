const mongoose = require('mongoose');
const User = require('./model/user.model');
const Payment = require('./model/payment.model');
require('dotenv').config();

const dbURI = "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

async function verifyUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB (Correct Cluster)");

        const user = await User.findOne({ email: "dalal.abhishek22@gmail.com" });
        if (user) {
            console.log("User Found:");
            console.log("Name:", user.fname, user.lname);
            console.log("Email:", user.email);
            console.log("Mobile:", user.mobile);
            console.log("City:", user.city);
            console.log("State:", user.state);
            console.log("Role:", user.playerRole);
            console.log("Is Paid:", user.isPaid);
            console.log("Payment Amount:", user.paymentAmount);
            console.log("Payment ID:", user.paymentId);

            const payment = await Payment.findOne({ transactionId: "395017047724" });
            if (payment) {
                console.log("Payment Record Found:", payment.transactionId, payment.amount, payment.status);
            } else {
                console.log("Payment Record NOT Found!");
            }

        } else {
            console.log("User NOT Found!");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyUser();
