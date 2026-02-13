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
        const campaign = await Campaign.findByIdAndDelete(id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }
        res.status(200).json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, targetUrl, description } = req.body;

        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return res.status(404).json({ success: false, message: "Campaign not found" });
        }

        campaign.title = title || campaign.title;
        campaign.description = description || campaign.description;

        if (targetUrl) {
            // Check if the user is providing a strictly new base URL or the full URL.
            // We want to ensure 'campaign=CODE' is present.
            // Simplified logic: If existing code is not in new url, append it.
            if (!targetUrl.includes(`campaign=${campaign.code}`)) {
                const separator = targetUrl.includes('?') ? '&' : '?';
                campaign.targetUrl = `${targetUrl}${separator}campaign=${campaign.code}`;
            } else {
                campaign.targetUrl = targetUrl;
            }
        }

        await campaign.save();

        res.status(200).json({ success: true, message: "Campaign updated successfully", data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

