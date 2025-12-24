const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

router.post('/order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
