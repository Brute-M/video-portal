const Job = require('../model/job.model');
const { s3Client, deleteFromS3, getPresignedUrl } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure S3 storage for Jobs (JDs)
const storage = multerS3({
    s3: s3Client,
    bucket: 'brpl-uploads', // Assuming same bucket
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        cb(null, `jobs/${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Helper to extract key from URL
const getKeyFromUrl = (url) => {
    if (!url) return null;
    try {
        if (url.startsWith('http')) {
            const urlObj = new URL(url);
            return decodeURIComponent(urlObj.pathname.slice(1));
        }
        return url;
    } catch (e) {
        const parts = url.split('.com/');
        return parts.length > 1 ? decodeURIComponent(parts[1]) : url;
    }
};

// Create Job
const createJob = async (req, res) => {
    try {
        const { title, description, salary, status, experience, jdContent } = req.body;

        if (!req.file && !jdContent) {
            return res.status(400).json({ message: 'JD file OR JD Content is required' });
        }

        const jdFile = req.file ? req.file.location : null;

        const newJob = new Job({
            title,
            description,
            jdFile,
            jdContent,
            salary,
            status,
            experience
        });

        await newJob.save();

        res.status(201).json({ statusCode: 201, data: newJob, message: "Job created successfully" });
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ statusCode: 500, message: "Error creating job", error: error.message });
    }
};

// Get All Jobs
const getJobs = async (req, res) => {
    try {
        const jobsRaw = await Job.find().sort({ createdAt: -1 }).lean();

        // Sign URLs
        const jobs = await Promise.all(jobsRaw.map(async (job) => {
            if (job.jdFile) {
                const key = getKeyFromUrl(job.jdFile);
                if (key) {
                    const signed = await getPresignedUrl(key, { ResponseContentDisposition: 'inline' });
                    if (signed) job.jdFile = signed;
                }
            }
            return job;
        }));

        res.status(200).json({ statusCode: 200, data: jobs });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ statusCode: 500, message: "Error fetching jobs" });
    }
};


// Get Single Job
const getJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id).lean();

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.jdFile) {
            const key = getKeyFromUrl(job.jdFile);
            if (key) {
                const signed = await getPresignedUrl(key, { ResponseContentDisposition: 'inline' });
                if (signed) job.jdFile = signed;
            }
        }

        res.status(200).json({ statusCode: 200, data: job });
    } catch (error) {
        console.error("Error fetching job:", error);
        res.status(500).json({ statusCode: 500, message: "Error fetching job" });
    }
};

// Update Job
const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, salary, status, experience, jdContent } = req.body;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (title) job.title = title;
        if (description) job.description = description;
        if (salary) job.salary = salary;
        if (status) job.status = status;
        if (experience) job.experience = experience;
        if (jdContent !== undefined) job.jdContent = jdContent;

        if (req.file) {
            // Delete old file
            if (job.jdFile) {
                const key = getKeyFromUrl(job.jdFile);
                if (key) await deleteFromS3(key).catch(e => console.error("Failed to delete old JD", e));
            }
            job.jdFile = req.file.location;
        }

        await job.save();
        res.status(200).json({ statusCode: 200, data: job, message: "Job updated successfully" });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ statusCode: 500, message: "Error updating job", error: error.message });
    }
};

// Delete Job
const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.jdFile) {
            const key = getKeyFromUrl(job.jdFile);
            if (key) await deleteFromS3(key).catch(e => console.error("Failed to delete JD", e));
        }

        await Job.findByIdAndDelete(id);

        res.status(200).json({ statusCode: 200, message: "Job deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ statusCode: 500, message: "Error deleting job" });
    }
};

module.exports = {
    upload,
    createJob,
    getJobs,
    getJob,
    updateJob,
    deleteJob
};
