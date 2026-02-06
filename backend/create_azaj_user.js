const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
const Payment = require('./model/payment.model');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbURI = process.env.MONGO_URL || "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

const createAzajUser = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log('Connected to MongoDB');

        const userData = {
            fname: "Azaj",
            lname: "Khan",
            email: "azajkhan11111111122222222@gmail.com",
            mobile: "9999999999", // Placeholder
            password: "123456",
            role: "user",
            isPaid: true,
            isFromLandingPage: true, // Note: field name in model schema might be isFromLandingPage based on create_manual_user.js
            paymentAmount: 1499,
            paymentId: "T2601221549463190402206",
            city: "UNKNOWN",
            state: "UNKNOWN"
        };

        const paymentData = {
            transactionId: userData.paymentId,
            amount: userData.paymentAmount,
            type: 'registration',
            status: 'completed',
            paymentGateway: 'phonepe', // Inferred from image
            date: new Date()
        };

        // Check if user exists
        let user = await User.findOne({ email: userData.email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        if (user) {
            console.log('User already exists:', user.email);
            // Update existing user
            user.isPaid = true;
            user.isFromLandingPage = true;
            user.paymentAmount = userData.paymentAmount;
            user.paymentId = userData.paymentId;
            user.password = hashedPassword;
            user.fname = userData.fname;
            user.lname = userData.lname;

            await user.save();
            console.log('User updated successfully');
        } else {
            // Create new user
            user = new User({
                ...userData,
                password: hashedPassword
            });
            await user.save();
            console.log('User created successfully:', user._id);
        }

        // Create Payment Record
        const newPayment = new Payment({
            userId: user._id,
            ...paymentData
        });

        await newPayment.save();
        console.log('Payment record created successfully');

    } catch (error) {
        console.error('Error creating user/payment:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

createAzajUser();
