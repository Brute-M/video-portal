const Partner = require('../model/partner.model');
const { sendPartnerEmail } = require('../utils/emailService');

exports.createPartner = async (req, res) => {
    try {
        const { firstName, lastName, email, contactNumber, partnershipType, message } = req.body;

        const newPartner = new Partner({
            firstName,
            lastName,
            email,
            contactNumber,
            partnershipType,
            message
        });

        await newPartner.save();

        try {
            // Send email using the dedicated partner email function
            await sendPartnerEmail({
                firstName,
                lastName,
                email,
                contactNumber,
                partnershipType,
                message
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // We don't fail the request if email fails, but we log it
        }

        res.status(201).json({ message: 'Partner request submitted successfully', partner: newPartner });
    } catch (error) {
        console.error('Error submitting partner request:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getAllPartners = async (req, res) => {
    try {
        const partners = await Partner.find().sort({ createdAt: -1 });
        res.status(200).json(partners);
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
