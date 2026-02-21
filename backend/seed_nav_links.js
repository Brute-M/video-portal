const mongoose = require('mongoose');
const NavLink = require('./model/navLink.model');
require('dotenv').config();

// const dbURI = "mongodb://localhost:27017/videoPortal";
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

const defaultLinks = [
    { label: "Home", path: "/", order: 0, isActive: true, isExternal: false },
    { label: "About Us", path: "/about-us", order: 1, isActive: true, isExternal: false },
    { label: "Teams", path: "/teams", order: 2, isActive: true, isExternal: false },
    { label: "Events", path: "/events", order: 3, isActive: true, isExternal: false },
    { label: "Career", path: "/career", order: 4, isActive: true, isExternal: false },
    { label: "Registration", path: "//registration", order: 5, isActive: true, isExternal: false },
    { label: "Contact Us", path: "/contact-us", order: 6, isActive: true, isExternal: false },
];

const seedNavLinks = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log("Connected to MongoDB");

        // Check if links already exist
        const count = await NavLink.countDocuments();
        if (count > 0) {
            console.log("Nav links already exist. Skipping seed.");
        } else {
            await NavLink.insertMany(defaultLinks);
            console.log("Default nav links seeded successfully.");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding nav links:", error);
        process.exit(1);
    }
};

seedNavLinks();
