const Coupon = require('../model/coupon.model');

// Admin: Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    if (req.role !== 'admin' && req.role !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Forbidden' } });
    }

    const coupons = await Coupon.find()
      .sort({ createdAt: -1 })
      .populate('usedBy.userId', 'fname lname email mobile');

    return res.json({ statusCode: 200, data: coupons });
  } catch (error) {
    console.error('Get all coupons error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

// Admin: Create coupon
const createCoupon = async (req, res) => {
  try {
    if (req.role !== 'admin' && req.role !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Forbidden' } });
    }

    const { code, type, value, minOrder, maxDiscount, usageLimit, perUserLimit, expiryDate, description, isActive } = req.body;

    if (!code || !value || !expiryDate) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Code, value, and expiry date are required' } });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Coupon code already exists' } });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type: type || 'percentage',
      value: Number(value),
      minOrder: Number(minOrder) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      expiryDate: new Date(expiryDate),
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({ statusCode: 201, data: coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: error.message || 'Server error' } });
  }
};

// Admin: Update coupon
const updateCoupon = async (req, res) => {
  try {
    if (req.role !== 'admin' && req.role !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Forbidden' } });
    }

    const { id } = req.params;
    const { code, type, value, minOrder, maxDiscount, usageLimit, perUserLimit, expiryDate, description, isActive } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Coupon not found' } });
    }

    // Check for duplicate code if code is being changed
    if (code && code.toUpperCase().trim() !== coupon.code) {
      const duplicate = await Coupon.findOne({ code: code.toUpperCase().trim(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Coupon code already exists' } });
      }
      coupon.code = code.toUpperCase().trim();
    }

    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = Number(value);
    if (minOrder !== undefined) coupon.minOrder = Number(minOrder);
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit ? Number(perUserLimit) : 1;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (description !== undefined) coupon.description = description;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    return res.json({ statusCode: 200, data: coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: error.message || 'Server error' } });
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    if (req.role !== 'admin' && req.role !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Forbidden' } });
    }

    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Coupon not found' } });
    }

    return res.json({ statusCode: 200, data: { message: 'Coupon deleted successfully' } });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

// Public: Validate and apply coupon code
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, userId } = req.body;

    if (!code) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Coupon code is required' } });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Invalid coupon code' } });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ statusCode: 400, data: { message: 'This coupon is no longer active' } });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ statusCode: 400, data: { message: 'This coupon has expired' } });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ statusCode: 400, data: { message: 'This coupon has reached its usage limit' } });
    }

    if (userId && coupon.perUserLimit) {
      const userUsageCount = coupon.usedBy.filter(u => String(u.userId) === String(userId)).length;
      if (userUsageCount >= coupon.perUserLimit) {
        return res.status(400).json({ statusCode: 400, data: { message: 'You have already used this coupon the maximum number of times' } });
      }
    }

    const amount = Number(orderAmount) || 0;
    if (coupon.minOrder > 0 && amount < coupon.minOrder) {
      return res.status(400).json({ statusCode: 400, data: { message: `Minimum order amount is ₹${coupon.minOrder}` } });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    discount = Math.min(discount, amount);

    return res.json({
      statusCode: 200,
      data: {
        valid: true,
        couponId: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount * 100) / 100,
        finalAmount: Math.round((amount - discount) * 100) / 100,
        description: coupon.description
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

// Internal: Mark coupon as used by a user (called during registration)
const markCouponUsed = async (couponCode, userId) => {
  try {
    if (!couponCode || !userId) return;
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon) return;

    coupon.usedCount += 1;
    coupon.usedBy.push({ userId, usedAt: new Date() });
    await coupon.save();
  } catch (error) {
    console.error('Mark coupon used error:', error);
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  markCouponUsed
};
