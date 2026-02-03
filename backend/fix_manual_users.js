const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
require('dotenv').config();

// Hardcoded DB URI as seen in other scripts to ensure connection if .env is missing/different context
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

const usersToFix = [
    {
        name: "Ajaz",
        email: "azajkhan1111111222222222@gmail.com",
        paymentId: "pay_S6t91gOwRby2nW",
        mobile: "7991224540",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Amar",
        email: "amar.singh1994june@gmail.com",
        paymentId: "pay_S4eGfqgmhzI1h1",
        mobile: "7903160997",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Anand",
        email: "anandydu3@gmail.com",
        paymentId: "pay_S7jzRXgsaOy1YJ",
        mobile: "7379802070",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Bhanu",
        email: "bpsingh.nirala@gmail.com",
        paymentId: "pay_S9CPbO2Lu8KvA",
        mobile: "8525395163",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Deepak",
        email: "rulhandk@gmail.com",
        paymentId: "pay_S4A7RyRE7gNTmH",
        mobile: "6397544596",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Hitesh",
        email: "hvaswami43@gmail.com",
        paymentId: "pay_S2VwY2ta8g46JE",
        mobile: "7768034343",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Juned",
        email: "poqravajuned@gmail.com",
        paymentId: "pay_S82EKntFeFD4pX",
        mobile: "9998876215",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Krishna",
        email: "krishnasingh1262004@gmail.com",
        paymentId: "pay_S8ulnqnW6HSnoL",
        mobile: "8299628678",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Prakash",
        email: "prakashchanda415@gmail.com",
        paymentId: "pay_S7lvsCc5Yh5bnb",
        mobile: "7610082416",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Sanjeev",
        email: "singhsamson753@gmail.com",
        paymentId: "pay_S8PlBAENYAzHP5",
        mobile: "7889918314",
        passwordRaw: "123456",
        role: "All Rounder"
    },
    {
        name: "Gopal",
        email: "gr2180177@gmail.com",
        paymentId: "pay_S9qlfY9BIVjAFg",
        mobile: "9076498959",
        passwordRaw: "123456",
        role: "All Rounder"
    }
];

async function fixUsers() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for user fix");

        for (const user of usersToFix) {
            const hashedPassword = await bcrypt.hash(user.passwordRaw, 10);

            // Using upsert to update if exists, or create if not
            // Searching primarily by email as it's the most unique and reliable identifier from the list
            const filter = { email: user.email.toLowerCase() };
            const update = {
                fname: user.name,
                email: user.email.toLowerCase(),
                mobile: user.mobile, // Ensure clean mobile
                password: hashedPassword,
                paymentId: user.paymentId,
                playerRole: user.role,
                isPaid: true,
                paymentAmount: 1499, // Assuming standard amount as per previous context
                isFromLandingPage: true, // Assuming these are landing page users
                city: 'Unknown', // Default if missing
                state: 'Unknown'  // Default if missing
            };

            const result = await User.findOneAndUpdate(filter, update, {
                new: true,
                upsert: true, // Create if doesn't exist
                setDefaultsOnInsert: true
            });

            console.log(`Processed user ${user.name} (${user.email}): ${result ? 'Success' : 'Failed'}`);
        }

        console.log("All users processed.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing users:", error);
        process.exit(1);
    }
}

fixUsers();
