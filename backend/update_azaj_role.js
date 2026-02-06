const mongoose = require('mongoose');
const User = require('./model/user.model');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbURI = process.env.MONGO_URL || "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

const updateAzajRole = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log('Connected to MongoDB');

        const email = "azajkhan11111111122222222@gmail.com";
        const newRole = "all rounder"; // Assuming this is the value they want for 'playerRole' field, assuming it's free text or matches convention

        const user = await User.findOne({ email: email });

        if (user) {
            user.playerRole = newRole;
            await user.save();
            console.log(`Updated playerRole for ${user.email} to '${newRole}'`);
        } else {
            console.log('User not found:', email);
        }

    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

updateAzajRole();
