const express = require('express');
const router = express.Router();
const eventController = require('../controller/eventController');

// Helper to handle multiple fields
const uploadFields = eventController.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 20 }
]);

router.post('/create', uploadFields, eventController.createEvent);
router.put('/:id', uploadFields, eventController.updateEvent);
router.get('/', eventController.getEvents);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
