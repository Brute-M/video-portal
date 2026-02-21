const OurTeam = require('../model/ourTeam.model');
const { deleteFromS3, resolveImageUrl } = require('../utils/s3Client');

function isS3Key(value) {
    return value && typeof value === 'string' && !value.startsWith('http') && !value.startsWith('uploads/');
}

// Create a new team member
exports.createMember = async (req, res) => {
    try {
        const { name, role, bio, order } = req.body;
        const file = req.file;

        const image = file ? file.key : "";

        const newMember = new OurTeam({
            name,
            role,
            bio,
            order,
            image
        });

        await newMember.save();
        const obj = newMember.toObject ? newMember.toObject() : newMember;
        if (obj.image) obj.image = await resolveImageUrl(obj.image);
        res.status(201).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all team members
exports.getAllMembers = async (req, res) => {
    try {
        const members = await OurTeam.find().sort({ order: 1, createdAt: 1 });
        const withUrls = await Promise.all(members.map(async (m) => {
            const obj = m.toObject ? m.toObject() : m;
            if (obj.image) obj.image = await resolveImageUrl(obj.image);
            return obj;
        }));
        res.status(200).json({ success: true, data: withUrls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single member by ID
exports.getMemberById = async (req, res) => {
    try {
        const member = await OurTeam.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: "Team member not found" });
        }
        const obj = member.toObject ? member.toObject() : member;
        if (obj.image) obj.image = await resolveImageUrl(obj.image);
        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update member
exports.updateMember = async (req, res) => {
    try {
        const { name, role, bio, order } = req.body;
        const file = req.file;

        let member = await OurTeam.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: "Team member not found" });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (bio !== undefined) updateData.bio = bio;
        if (order !== undefined) updateData.order = order;

        if (file) {
            if (member.image && isS3Key(member.image)) {
                await deleteFromS3(member.image).catch(err => console.error("Failed to delete old image from S3:", err));
            }
            updateData.image = file.key;
        }

        member = await OurTeam.findByIdAndUpdate(req.params.id, updateData, { new: true });
        const obj = member.toObject ? member.toObject() : member;
        if (obj.image) obj.image = await resolveImageUrl(obj.image);
        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete member
exports.deleteMember = async (req, res) => {
    try {
        const member = await OurTeam.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: "Team member not found" });
        }

        if (member.image && isS3Key(member.image)) {
            await deleteFromS3(member.image).catch(err => console.error("Failed to delete image from S3:", err));
        }

        await OurTeam.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Team member deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
