const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/user.model');

// Using the connection string from .env
const dbURI = "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

async function createSubadminUser() {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB for subadmin creation");

        const email = "subadmin@brpl.com";
        const passwordPlain = "Subadmin@123";
        const fname = "Sub";
        const lname = "Admin";
        const mobile = "9999999999";
        const role = "subadmin";

        // Check if user already exists
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Subadmin user already exists. Updating role and password...");
            const hashedPassword = await bcrypt.hash(passwordPlain, 10);
            existingUser.role = role;
            existingUser.password = hashedPassword;
            await existingUser.save();
            console.log("Subadmin user updated successfully.");
        } else {
            console.log("Creating new subadmin user...");
            const hashedPassword = await bcrypt.hash(passwordPlain, 10);
            const newUser = new User({
                fname,
                lname,
                email,
                password: hashedPassword,
                mobile,
                role, // Important: setting the role
                city: "Headquarters",
                state: "Delhi",
                isPaid: false // System users typically don't pay
            });

            const savedUser = await newUser.save();
            console.log("Subadmin user created successfully with ID:", savedUser._id);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error creating subadmin user:", err);
        process.exit(1);
    }
}

createSubadminUser();
