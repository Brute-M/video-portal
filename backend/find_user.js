const mongoose = require('mongoose');
const User = require('./model/user.model');
const Step1Lead = require('./model/step1_lead.model');

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

async function findData() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const mobile = "9717174805";
        const email = "sardanapankul@gmail.com";
        console.log(`Searching for Mobile: ${mobile}, Email: ${email}`);

        const userByMobile = await User.findOne({ mobile });
        const userByEmail = await User.findOne({ email });

        if (userByMobile) {
            console.log("User found by mobile:", JSON.stringify(userByMobile, null, 2));
        }
        if (userByEmail) {
            console.log("User found by email:", JSON.stringify(userByEmail, null, 2));
        }
        if (!userByMobile && !userByEmail) {
            console.log("User not found by mobile or email");
        }

        const leadByMobile = await Step1Lead.findOne({ mobile });
        const leadByEmail = await Step1Lead.findOne({ email: { $regex: email, $options: 'i' } });

        if (leadByMobile) {
            console.log("Lead found by mobile:", JSON.stringify(leadByMobile, null, 2));
        }
        if (leadByEmail) {
            console.log("Lead found by email:", JSON.stringify(leadByEmail, null, 2));
        }
        if (!leadByMobile && !leadByEmail) {
            console.log("Lead not found by mobile or email");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

findData();
