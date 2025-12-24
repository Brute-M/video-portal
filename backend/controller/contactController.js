const Contact = require('../model/contactModel');
const { sendContactEmail } = require('../utils/emailService');

exports.submitContact = async (req, res) => {
    try {
        const { firstName, lastName, mobileNumber, email, message } = req.body;

        // 1. Save to Database
        const newContact = new Contact({
            firstName,
            lastName,
            mobileNumber,
            email,
            message
        });
        await newContact.save();

        // 2. Send Email to Company
        await sendContactEmail({
            firstName,
            lastName,
            email,
            mobileNumber,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Contact details submitted successfully'
        });

    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing your request'
        });
    }
};
