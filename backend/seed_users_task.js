const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
const Payment = require('./model/payment.model');
require('dotenv').config();

// Connection string from create_manual_user.js
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

const usersToSeed = [
    { name: "Ajaz", email: "azajkhan1111111222222222@gmail.com", paymentId: "pay_S6t91gOwRby2nW", mobile: "7991224540", pass: "123456", role: "All Rounder" },
    { name: "Amar", email: "amar.singh1994june@gmail.com", paymentId: "pay_S4eGfqgmhzI1h1", mobile: "7903160997", pass: "123456", role: "All Rounder" },
    { name: "Anand", email: "anandydu3@gmail.com", paymentId: "pay_S7jzRXgsaOy1YJ", mobile: "7379802070", pass: "123456", role: "All Rounder" },
    { name: "Bhanu", email: "bpsingh.nirala@gmail.com", paymentId: "pay_S9CPbO2Lu8KvA", mobile: "8525395163", pass: "123456", role: "All Rounder" },
    { name: "Deepak", email: "rulhandk@gmail.com", paymentId: "pay_S4A7RyRE7gNTmH", mobile: "6397544596", pass: "123456", role: "All Rounder" },
    { name: "Hitesh", email: "hvaswami43@gmail.com", paymentId: "pay_S2VwY2ta8g46JE", mobile: "7768034343", pass: "123456", role: "All Rounder" },
    { name: "Juned", email: "poqravajuned@gmail.com", paymentId: "pay_S82EKntFeFD4pX", mobile: "9998876215", pass: "123456", role: "All Rounder" },
    { name: "Krishna", email: "krishnasingh1262004@gmail.com", paymentId: "pay_S8ulnqnW6HSnoL", mobile: "8299628678", pass: "123456", role: "All Rounder" },
    { name: "Prakash", email: "prakashchanda415@gmail.com", paymentId: "pay_S7lvsCc5Yh5bnb", mobile: "7610082416", pass: "123456", role: "All Rounder" },
    { name: "Sanjeev", email: "singhsamson753@gmail.com", paymentId: "pay_S8PlBAENYAzHP5", mobile: "7889918314", pass: "123456", role: "All Rounder" },
    { name: "Gopal", email: "gr2180177@gmail.com", paymentId: "pay_S9qlfY9BIVjAFg", mobile: "9076498959", pass: "123456", role: "All Rounder" },
    { name: "Nahush Sharma", email: "archanaparshaadward34@gmail.com", paymentId: "pay_S4ECpBYbQ73exx", mobile: "8954599909", pass: "123456", role: "All Rounder" }
];

async function seedUsers() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for seeding.");

        const hashedDefaultPassword = await bcrypt.hash("123456", 10);

        for (const data of usersToSeed) {
            // Check if user exists
            const existingUser = await User.findOne({
                $or: [{ email: data.email }, { mobile: data.mobile }]
            });

            if (existingUser) {
                console.log(`Skipping existing user: ${data.email} / ${data.mobile}`);
                // Optional: Update existing user to be Paid/LandingPage if needed?
                // For now, just skip as per typical seeding logic unless instructed otherwise.
                continue;
            }

            // Split name
            const nameParts = data.name.trim().split(/\s+/);
            const fname = nameParts[0];
            const lname = nameParts.slice(1).join(' ') || "";

            const newUser = new User({
                fname: fname,
                lname: lname,
                email: data.email,
                password: hashedDefaultPassword,
                mobile: data.mobile,
                city: "UNKNOWN",
                state: "UNKNOWN",
                playerRole: data.role,
                isPaid: true,
                paymentAmount: 1499,
                paymentId: data.paymentId,
                isFromLandingPage: true, // "islandingPage" mapped to isFromLandingPage
                conversionType: 'none'
            });

            const savedUser = await newUser.save();
            console.log(`Created User: ${data.name} (${savedUser.email})`);

            // Create Payment Record
            const newPayment = new Payment({
                userId: savedUser._id,
                transactionId: data.paymentId,
                amount: 1499,
                type: 'registration',
                status: 'completed',
                paymentGateway: 'razorpay'
            });

            await newPayment.save();
            console.log(`Created Payment for: ${data.name}`);
        }

        console.log("Seeding completed.");
        process.exit(0);

    } catch (err) {
        console.error("Error during seeding:", err);
        process.exit(1);
    }
}

seedUsers();
