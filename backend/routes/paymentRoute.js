const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');

router.post('/order', paymentController.createOrder);
router.get('/order/:id', paymentController.getOrderDetails);
router.post('/order-landing', paymentController.createOrderLanding);
router.post('/order-mobile', paymentController.createOrderMobile);
router.post('/order-registration-influencer', paymentController.createOrderRegistrationInfluencer);
router.post('/verify', paymentController.verifyPayment);
router.post('/verify-landing', paymentController.verifyLandingPayment);
router.post('/verify-landing-influencer', paymentController.verifyLandingPaymentInfluencer);
router.post('/verify-mobile', paymentController.verifyMobilePayment);

module.exports = router;
