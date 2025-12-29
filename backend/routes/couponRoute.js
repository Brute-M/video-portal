const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authMiddleware');
const { getActiveCoupon, generateAndActivateCoupon, getCouponUsageAdmin } = require('../controller/couponController');

router.get('/active', getActiveCoupon);
router.post('/generate', authenticate, generateAndActivateCoupon);
router.get('/usage', authenticate, getCouponUsageAdmin);

module.exports = router;
