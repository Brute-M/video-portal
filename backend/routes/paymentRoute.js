const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

router.post('/order', paymentController.createOrder);
router.post('/order-landing', paymentController.createOrderLanding);
router.post('/verify', paymentController.verifyPayment);
router.post('/verify-landing', paymentController.verifyLandingPayment);

module.exports = router;
