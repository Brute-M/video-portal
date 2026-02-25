const express = require('express');
const router = express.Router();
const webhookController = require('../controller/webhookController');

router.post('/razorpay', webhookController.handleRazorpayWebhook);

module.exports = router;
