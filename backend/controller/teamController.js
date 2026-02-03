const Team = require('../model/Team');
const { deleteFromS3, getPresignedUrl } = require('../utils/s3Client');

exports.createTeam = async (req, res) => {
    try {
        const { name, order } = req.body;
        let logo = req.body.logo;
        let logoKey = null;

        if (req.file) {
            logo = req.file.location;
            logoKey = req.file.key;
        }

        if (!logo) {
            return res.status(400).json({ message: "Logo is required" });
        }

        const team = new Team({
            name,
            logo,
            logoKey,
            order: order || 0
        });
        await team.save();
        res.status(201).json(team);
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: "Error creating team" });
    }
};

exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find().sort({ order: 1, createdAt: -1 });

        const teamsWithSignedUrls = await Promise.all(teams.map(async (team) => {
            if (team.logoKey) {
                const signedUrl = await getPresignedUrl(team.logoKey);
                if (signedUrl) {
                    return { ...team.toObject(), logo: signedUrl };
                }
            }
            return team;
        }));

        res.status(200).json(teamsWithSignedUrls);
    } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ message: "Error fetching teams" });
    }
};

exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        if (team.logoKey) {
            const signedUrl = await getPresignedUrl(team.logoKey);
            if (signedUrl) {
                return res.status(200).json({ ...team.toObject(), logo: signedUrl });
            }
        }

        res.status(200).json(team);
    } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ message: "Error fetching team" });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { name, order } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        if (name) team.name = name;
        if (order) team.order = order;

        if (req.file) {
            if (team.logoKey) {
                await deleteFromS3(team.logoKey).catch(err => console.error("Failed to delete old logo", err));
            }
            team.logo = req.file.location;
            team.logoKey = req.file.key;
        } else if (req.body.logo) {
            team.logo = req.body.logo;
            if (!req.body.logo.includes(process.env.AWS_BUCKET_NAME || 'brpl-uploads')) {
                team.logoKey = null;
            }
        }

        await team.save();
        res.status(200).json(team);
    } catch (error) {
        console.error("Error updating team:", error);
        res.status(500).json({ message: "Error updating team" });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        if (team.logoKey) {
            await deleteFromS3(team.logoKey).catch(err => console.error("Failed to delete logo from S3", err));
        }

        res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ message: "Error deleting team" });
    }
};
