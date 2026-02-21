const OurTeam = require('../model/ourTeam.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File Upload Configuration: save to same folder that server.js serves via express.static
const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'team-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'));
        }
    }
});

// Create a new team member
exports.createMember = async (req, res) => {
    try {
        const { name, role, bio, order } = req.body;
        const file = req.file;

        let imagePath = "";
        if (file) {
            imagePath = "uploads/" + file.filename;
        }

        const newMember = new OurTeam({
            name,
            role,
            bio,
            order,
            image: imagePath
        });

        await newMember.save();
        res.status(201).json({ success: true, data: newMember });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all team members
exports.getAllMembers = async (req, res) => {
    try {
        const members = await OurTeam.find().sort({ order: 1, createdAt: 1 });
        res.status(200).json({ success: true, data: members });
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
        res.status(200).json({ success: true, data: member });
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
            // Optional: Delete old image
            if (member.image) {
                const oldPath = path.join(__dirname, '..', member.image);
                if (fs.existsSync(oldPath)) {
                    fs.unlink(oldPath, (err) => {
                        if (err) console.error("Failed to delete old image:", err);
                    });
                }
            }
            updateData.image = `uploads/${file.filename}`;
        }

        member = await OurTeam.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json({ success: true, data: member });
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

        // Delete image file
        if (member.image) {
            const imagePath = path.join(__dirname, '..', member.image);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) console.error("Failed to delete image:", err);
                });
            }
        }

        await OurTeam.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Team member deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.upload = upload;
