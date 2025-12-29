const Coupon = require('../model/coupon.model');

const normalizeRandomWord = (value) => {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
};

const generateCouponCode = ({ randomWord, year }) => {
  const rw = normalizeRandomWord(randomWord);
  const yr = String(year || new Date().getFullYear()).replace(/[^0-9]/g, '');
  if (!rw) {
    throw new Error('randomWord is required');
  }
  if (!yr || yr.length !== 4) {
    throw new Error('year must be a 4 digit year');
  }
  return `EARN${rw}${yr}`;
};

const generateRandomWord = (len = 10) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
};

const ensureActiveCoupon = async () => {
  const existing = await Coupon.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
  if (existing) return existing;

  const year = new Date().getFullYear();

  for (let i = 0; i < 20; i++) {
    const randomWord = generateRandomWord(10);
    const code = generateCouponCode({ randomWord, year });
    const exists = await Coupon.exists({ code });
    if (exists) continue;

    await Coupon.updateMany({ isActive: true }, { $set: { isActive: false } });
    const created = await Coupon.create({
      code,
      isActive: true,
      benefits: []
    });
    return created.toObject();
  }

  throw new Error('Failed to auto-generate active coupon');
};

const getActiveCoupon = async (req, res) => {
  try {
    const coupon = await ensureActiveCoupon();

    if (!coupon) {
      return res.status(404).json({ statusCode: 404, data: { message: 'No active coupon found' } });
    }

    return res.json({
      statusCode: 200,
      data: {
        code: coupon.code,
        benefits: coupon.benefits,
        usedCount: coupon.usedCount
      }
    });
  } catch (error) {
    console.error('Get active coupon error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

const getCouponUsageAdmin = async (req, res) => {
  try {
    if (req.role !== 'admin' && req.userId !== 'admin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Forbidden' } });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const code = (req.query.code || '').toString().trim().toUpperCase();
    const isActive = (req.query.isActive || '').toString().trim();

    const filter = {};
    if (code) filter.code = code;
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

    const total = await Coupon.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);

    const items = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit)
      .populate('usedBy', 'fname lname email mobile couponCodeUsed createdAt');

    return res.json({
      statusCode: 200,
      data: {
        items,
        pagination: {
          page: safePage,
          limit,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get coupon usage admin error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

const generateAndActivateCoupon = async (req, res) => {
  try {
    if (req.role !== 'admin' && req.userId !== 'admin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Forbidden' } });
    }

    const { randomWord, year, benefits } = req.body;
    const code = generateCouponCode({ randomWord, year });

    const existing = await Coupon.findOne({ code }).lean();
    if (existing) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Coupon code already exists' } });
    }

    await Coupon.updateMany({ isActive: true }, { $set: { isActive: false } });

    const coupon = await Coupon.create({
      code,
      isActive: true,
      benefits: Array.isArray(benefits) ? benefits : []
    });

    return res.status(201).json({
      statusCode: 201,
      data: {
        message: 'Coupon generated and activated',
        coupon: {
          id: coupon._id,
          code: coupon.code,
          isActive: coupon.isActive,
          benefits: coupon.benefits,
          usedCount: coupon.usedCount
        }
      }
    });
  } catch (error) {
    console.error('Generate coupon error:', error);
    return res.status(500).json({ statusCode: 500, data: { message: error.message || 'Server error' } });
  }
};

module.exports = {
  getActiveCoupon,
  generateAndActivateCoupon,
  getCouponUsageAdmin,
  ensureActiveCoupon
};
