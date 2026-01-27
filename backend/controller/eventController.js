const Event = require('../model/event.model');
const { s3Client, deleteFromS3, getPresignedUrl } = require('../utils/s3Client');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure S3 storage for Events
const storage = multerS3({
    s3: s3Client,
    bucket: 'brpl-uploads',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        cb(null, `events/${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Create Event
const createEvent = async (req, res) => {
    try {
        const { title, date, location, category } = req.body;

        // Handle file uploads
        // req.files['image'] -> Main banner image
        // req.files['media'] -> Gallery items

        if (!req.files || !req.files['image']) {
            return res.status(400).json({ message: 'Main event image is required' });
        }

        const mainImage = req.files['image'][0].location;

        const mediaItems = [];
        // Single image enforcement: No gallery processing.
        // We can optionally push the main image to mediaItems if we want unified handling, 
        // but for now, we'll keep strict separation as requested.

        const newEvent = new Event({
            title,
            date,
            location,
            category,
            image: mainImage,
            media: mediaItems
        });

        await newEvent.save();

        res.status(201).json({ statusCode: 201, data: newEvent });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ statusCode: 500, message: "Error creating event", error: error.message });
    }
};

// Helper to extract key from URL
const getKeyFromUrl = (url) => {
    if (!url) return null;
    try {
        // Handle both full URL and relative path/key
        if (url.startsWith('http')) {
            const urlObj = new URL(url);
            // pathname includes leading slash, so slice(1)
            // But decoding is important if spaces etc.
            return decodeURIComponent(urlObj.pathname.slice(1));
        }
        return url;
    } catch (e) {
        // Fallback or simple split for safety
        const parts = url.split('.com/');
        return parts.length > 1 ? decodeURIComponent(parts[1]) : url;
    }
};

// Get All Events
const getEvents = async (req, res) => {
    try {
        const eventsRaw = await Event.find().sort({ createdAt: -1 }).lean(); // Use lean for faster perf and modification

        // Map and sign URLs
        const events = await Promise.all(eventsRaw.map(async (event) => {
            // Sign main image
            if (event.image) {
                const key = getKeyFromUrl(event.image);
                if (key) {
                    const signed = await getPresignedUrl(key);
                    if (signed) event.image = signed;
                }
            }

            // Sign gallery media
            if (event.media && event.media.length > 0) {
                const signedMedia = await Promise.all(event.media.map(async (item) => {
                    if (item.src) {
                        const key = getKeyFromUrl(item.src);
                        if (key) {
                            const signed = await getPresignedUrl(key);
                            if (signed) {
                                return { ...item, src: signed };
                            }
                        }
                    }
                    return item;
                }));
                event.media = signedMedia;
            }
            return event;
        }));

        res.status(200).json({ statusCode: 200, data: events });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ statusCode: 500, message: "Error fetching events" });
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Delete main image from S3 - Parse key from URL
        if (event.image) {
            const key = getKeyFromUrl(event.image);
            if (key) await deleteFromS3(key).catch(e => console.error("Failed to delete banner", e));
        }

        // Delete media files
        if (event.media && event.media.length > 0) {
            for (const item of event.media) {
                if (item.src) {
                    const key = getKeyFromUrl(item.src);
                    if (key) await deleteFromS3(key).catch(e => console.error("Failed to delete media item", e));
                }
            }
        }

        await Event.findByIdAndDelete(id);

        res.status(200).json({ statusCode: 200, message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ statusCode: 500, message: "Error deleting event" });
    }
};

// Update Event
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, location, category } = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Update fields
        if (title) event.title = title;
        if (date) event.date = date;
        if (location) event.location = location;
        if (category) event.category = category;

        // Handle image update
        if (req.files && req.files['image']) {
            // Delete old image
            if (event.image) {
                const key = getKeyFromUrl(event.image);
                if (key) await deleteFromS3(key).catch(e => console.error("Failed to delete old banner", e));
            }
            // Set new image
            event.image = req.files['image'][0].location;
        }

        await event.save();
        res.status(200).json({ statusCode: 200, data: event, message: "Event updated successfully" });

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ statusCode: 500, message: "Error updating event", error: error.message });
    }
};

module.exports = {
    upload,
    createEvent,
    getEvents,
    deleteEvent,
    updateEvent
};
