const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
const Payment = require('./model/payment.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function createNahushUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "archnaprashadward34@gmail.com";
        const passwordPlain = "nahush@123";
        const mobile = "8630691807";
        const fname = "nahush";
        const lname = "sharma";
        const transactionId = "pay_S4ECpBYbQ73exx";
        const amount = 1499;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { mobile }]
        });

        if (existingUser) {
            console.log("User already exists:", existingUser.email, existingUser.mobile);

            // Updating existing user to match requested details
            existingUser.email = email;
            existingUser.fname = fname;
            existingUser.lname = lname;
            existingUser.isPaid = true;
            existingUser.paymentAmount = amount;
            existingUser.paymentId = transactionId;
            existingUser.isFromLandingPage = true;

            // Update password
            const hashedPassword = await bcrypt.hash(passwordPlain, 10);
            existingUser.password = hashedPassword;

            await existingUser.save();
            console.log("User updated successfully:", existingUser._id);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        const newUser = new User({
            fname,
            lname,
            email,
            password: hashedPassword,
            mobile,
            city: "UNKNOWN",
            state: "UNKNOWN",
            isPaid: true,
            paymentAmount: amount,
            paymentId: transactionId,
            isFromLandingPage: true,
            conversionType: 'manual_creation'
        });

        const savedUser = await newUser.save();
        console.log("User created successfully with ID:", savedUser._id);

        const newPayment = new Payment({
            userId: savedUser._id,
            transactionId: transactionId,
            amount: amount,
            type: 'registration',
            status: 'completed',
            paymentGateway: 'razorpay'
        });

        const savedPayment = await newPayment.save();
        console.log("Payment record created successfully with ID:", savedPayment._id);

        process.exit(0);
    } catch (err) {
        console.error("Error creating/updating user:", err);
        process.exit(1);
    }
}

createNahushUser();
