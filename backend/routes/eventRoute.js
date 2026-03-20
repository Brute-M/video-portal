const express = require('express');
const router = express.Router();
const eventController = require('../controller/eventController');
const { uploadToVideoUploads } = require('../middleware/cloudStorageUploader');

// Helper to handle multiple fields
const uploadFields = eventController.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 20 }
]);

router.post('/create', uploadFields, uploadToVideoUploads, eventController.createEvent);
router.put('/:id', uploadFields, uploadToVideoUploads, eventController.updateEvent);
router.get('/', eventController.getEvents);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
