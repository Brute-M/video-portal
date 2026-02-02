const Coach = require('../model/coach.model');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const createCoach = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { name, email, mobile, academyName, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and Email are required' });
        }

        const existingCoach = await Coach.findOne({ email });
        if (existingCoach) {
            return res.status(400).json({ message: 'Coach with this email already exists' });
        }

        // Generate Referral Code: NAME + 4 Random Digits (e.g., ROHAN4821)
        const namePart = name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
        const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        let referralCode = `${namePart}${randomPart}`;

        // Ensure uniqueness
        let isUnique = false;
        while (!isUnique) {
            const exists = await Coach.exists({ referralCode });
            if (!exists) {
                isUnique = true;
            } else {
                referralCode = `${namePart}${Math.floor(1000 + Math.random() * 9000)}`;
            }
        }

        // Default attributes
        const password = await bcrypt.hash('Coach@123', 10); // Default password

        const newCoach = new Coach({
            name,
            email,
            referralCode,
            password,
            mobile: mobile || '0000000000',
            academyName: academyName || 'Brpl Academy',
            isActive: true,
            isVerified: true
        });

        await newCoach.save();

        // Construct Referral Link
        // Assuming the frontend URL is passed in env or we construct it
        // User requested response: { url: "https://yourapp.com/register?ref=ROHAN4821" }
        // We'll use a standard base URL if not in env
        const baseUrl = process.env.COACH_FRONTEND_URL || 'https://cricket.brpl.net';
        const referralLink = `${baseUrl}/?ref=${referralCode}`;

        res.status(201).json({
            statusCode: 201,
            data: {
                _id: newCoach._id,
                name: newCoach.name,
                email: newCoach.email,
                referralCode: newCoach.referralCode,
                url: referralLink
            }
        });

    } catch (error) {
        console.error("Create Coach Error:", error);
        res.status(500).json({ message: 'Server error creating coach' });
    }
};

const getReferralLink = async (req, res) => {
    try {
        const { id } = req.params;
        const coach = await Coach.findById(id);

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        const baseUrl = process.env.COACH_FRONTEND_URL || 'https://cricket.brpl.net';
        const referralLink = `${baseUrl}/?ref=${coach.referralCode}`;

        res.json({
            url: referralLink
        });
    } catch (error) {
        console.error("Get Referral Link Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createCoach,
    getReferralLink
};
