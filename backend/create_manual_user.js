const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');
const Payment = require('./model/payment.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function createManualUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const email = "sardanapankul@gmail.com";
        const passwordPlain = "Pankul0011";
        const mobile = "9717174805";
        const fname = "Pankul";
        const lname = "sardana";
        const transactionId = "T2601021819053526484387";
        const amount = 1499;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { mobile }]
        });

        if (existingUser) {
            console.log("User already exists:", existingUser.email, existingUser.mobile);
            process.exit(1);
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
            conversionType: 'none'
        });

        const savedUser = await newUser.save();
        console.log("User created successfully with ID:", savedUser._id);

        const newPayment = new Payment({
            userId: savedUser._id,
            transactionId: transactionId,
            amount: amount,
            type: 'registration',
            status: 'completed',
            paymentGateway: 'phonepe' // From screenshot icon
        });

        const savedPayment = await newPayment.save();
        console.log("Payment record created successfully with ID:", savedPayment._id);

        process.exit(0);
    } catch (err) {
        console.error("Error creating manual user:", err);
        process.exit(1);
    }
}

createManualUser();
