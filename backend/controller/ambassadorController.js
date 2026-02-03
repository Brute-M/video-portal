const Ambassador = require('../model/Ambassador');
const { deleteFromS3, getPresignedUrl } = require('../utils/s3Client');

exports.createAmbassador = async (req, res) => {
    try {
        const { name, designation, description, order } = req.body;
        let image = req.body.image;
        let imageKey = null;

        if (req.file) {
            image = req.file.location;
            imageKey = req.file.key;
        }

        if (!image) {
            return res.status(400).json({ message: "Image is required" });
        }

        const ambassador = new Ambassador({
            name,
            designation,
            description,
            image,
            imageKey,
            order: order || 0
        });
        await ambassador.save();
        res.status(201).json(ambassador);
    } catch (error) {
        console.error("Error creating ambassador:", error);
        res.status(500).json({ message: "Error creating ambassador" });
    }
};

exports.getAllAmbassadors = async (req, res) => {
    try {
        const ambassadors = await Ambassador.find().sort({ order: 1, createdAt: -1 });

        const ambassadorsWithSignedUrls = await Promise.all(ambassadors.map(async (ambassador) => {
            if (ambassador.imageKey) {
                const signedUrl = await getPresignedUrl(ambassador.imageKey);
                if (signedUrl) {
                    return { ...ambassador.toObject(), image: signedUrl };
                }
            }
            return ambassador;
        }));

        res.status(200).json(ambassadorsWithSignedUrls);
    } catch (error) {
        console.error("Error fetching ambassadors:", error);
        res.status(500).json({ message: "Error fetching ambassadors" });
    }
};

exports.getAmbassadorById = async (req, res) => {
    try {
        const ambassador = await Ambassador.findById(req.params.id);
        if (!ambassador) {
            return res.status(404).json({ message: "Ambassador not found" });
        }

        if (ambassador.imageKey) {
            const signedUrl = await getPresignedUrl(ambassador.imageKey);
            if (signedUrl) {
                return res.status(200).json({ ...ambassador.toObject(), image: signedUrl });
            }
        }

        res.status(200).json(ambassador);
    } catch (error) {
        console.error("Error fetching ambassador:", error);
        res.status(500).json({ message: "Error fetching ambassador" });
    }
};

exports.updateAmbassador = async (req, res) => {
    try {
        const { name, designation, description, order } = req.body;
        const ambassador = await Ambassador.findById(req.params.id);

        if (!ambassador) {
            return res.status(404).json({ message: "Ambassador not found" });
        }

        if (name) ambassador.name = name;
        if (designation) ambassador.designation = designation;
        if (description) ambassador.description = description;
        if (order) ambassador.order = order;

        if (req.file) {
            // Optional: delete old image
            if (ambassador.imageKey) {
                await deleteFromS3(ambassador.imageKey).catch(err => console.error("Failed to delete old image", err));
            }
            ambassador.image = req.file.location;
            ambassador.imageKey = req.file.key;
        } else if (req.body.image) {
            // Logic if updating image string manually (unlikely for upload flow, but possible)
            ambassador.image = req.body.image;
            // If manual URL provided, clear key as we don't manage it
            if (!req.body.image.includes(process.env.AWS_BUCKET_NAME || 'brpl-uploads')) {
                ambassador.imageKey = null;
            }
        }

        await ambassador.save();
        res.status(200).json(ambassador);
    } catch (error) {
        console.error("Error updating ambassador:", error);
        res.status(500).json({ message: "Error updating ambassador" });
    }
};

exports.deleteAmbassador = async (req, res) => {
    try {
        const ambassador = await Ambassador.findByIdAndDelete(req.params.id);
        if (!ambassador) {
            return res.status(404).json({ message: "Ambassador not found" });
        }

        if (ambassador.imageKey) {
            await deleteFromS3(ambassador.imageKey).catch(err => console.error("Failed to delete image from S3", err));
        }

        res.status(200).json({ message: "Ambassador deleted successfully" });
    } catch (error) {
        console.error("Error deleting ambassador:", error);
        res.status(500).json({ message: "Error deleting ambassador" });
    }
};
