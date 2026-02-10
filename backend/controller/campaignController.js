const Campaign = require('../model/campaign.model');
const User = require('../model/user.model');
const QRCode = require('qrcode');

exports.createCampaign = async (req, res) => {
    try {
        const { title, targetUrl, description } = req.body;

        // Generate a unique code (e.g., BRPL-Q101)
        const code = 'QR-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        // The actual link the QR will open: targetUrl + ?campaign=code
        // Ensure targetUrl doesn't already have params (basic implementation)
        const separator = targetUrl.includes('?') ? '&' : '?';
        const finalUrl = `${targetUrl}${separator}campaign=${code}`;

        const newCampaign = new Campaign({
            title,
            code,
            targetUrl: finalUrl,
            description,
            createdBy: req.userId || 'admin'
        });

        await newCampaign.save();

        // Generate QR Code Data URL
        const qrCodeData = await QRCode.toDataURL(finalUrl);

        res.status(201).json({
            success: true,
            data: {
                campaign: newCampaign,
                qrCode: qrCodeData
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ createdAt: -1 });

        // Enrich with stats (count users for each campaign)
        const enrichedCampaigns = await Promise.all(campaigns.map(async (camp) => {
            const count = await User.countDocuments({ campaignCode: camp.code });
            // Generate QR for frontend display/download convenience
            const qrCode = await QRCode.toDataURL(camp.targetUrl);
            return {
                ...camp.toObject(),
                userCount: count,
                qrCode
            };
        }));

        res.status(200).json({ success: true, data: enrichedCampaigns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await Campaign.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
