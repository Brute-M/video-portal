const mongoose = require('mongoose');
const NavLink = require('./model/navLink.model');
require('dotenv').config();

const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

const addPartnersLink = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        const partnerLink = { label: "Partners", path: "/partners", order: 7, isActive: true, isExternal: false };

        const existingLink = await NavLink.findOne({ path: partnerLink.path });

        if (existingLink) {
            console.log("Partners link already exists.");
        } else {
            const newLink = new NavLink(partnerLink);
            await newLink.save();
            console.log("Partners link added successfully.");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Error adding partners link:", error);
        process.exit(1);
    }
};

addPartnersLink();
