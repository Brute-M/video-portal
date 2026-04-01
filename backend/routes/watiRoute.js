const express = require('express');
const router = express.Router();

// Reuse existing implementation in paymentController to avoid duplication
const paymentController = require('../controller/paymentController');

// POST /api/wati/webhook
// Trigger WATI communication after successful registration payment
router.post('/webhook', paymentController.sendPaymentSuccessToWati);

module.exports = router;

