const express = require('express');
const router = express.Router();
const { handleWatiWebhook } = require('../controller/watiWebhookController');

// WATI sends webhook events here. Must respond 200 OK to acknowledge.
router.post('/webhook', handleWatiWebhook);

module.exports = router;
