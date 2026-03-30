const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authMiddleware');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controller/couponController');

// Admin routes
router.get('/', authenticate, getAllCoupons);
router.post('/', authenticate, createCoupon);
router.put('/:id', authenticate, updateCoupon);
router.delete('/:id', authenticate, deleteCoupon);

// Public route - validate coupon
router.post('/validate', validateCoupon);

module.exports = router;
