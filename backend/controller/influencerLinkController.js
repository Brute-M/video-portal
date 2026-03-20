const InfluencerLink = require('../model/InfluencerLink.model');
const InfluencerTracking = require('../model/InfluencerTracking.model');
const User = require('../model/user.model');

const slugRegex = /^[a-z0-9][a-z0-9_-]{0,39}$/;

const normalizeSlug = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, '-');

// Public: fetch amount by slug (for dynamic pricing display)
exports.getAmountBySlug = async (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Invalid slug' } });
    }

    const link = await InfluencerLink.findOne({ slug, status: 'active' }).lean();
    if (!link) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Slug not found or inactive' } });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Slug expired' } });
    }

    // Your example "test -> 999" maps to discountPrice.
    const amount = link.discountPrice != null ? Number(link.discountPrice) : 999;
    return res.json({ statusCode: 200, data: { slug: link.slug, amount } });
  } catch (err) {
    console.error('InfluencerLink getAmountBySlug error:', err);
    return res.status(500).json({ statusCode: 500, data: { message: 'Failed to fetch slug amount' } });
  }
};

// GET list (admin)
exports.list = async (req, res) => {
  try {
    const { status, sort = 'createdAt', order = 'desc', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ['active', 'inactive'].includes(status)) filter.status = status;

    const total = await InfluencerLink.countDocuments(filter);
    const sortDir = order === 'asc' ? 1 : -1;
    const items = await InfluencerLink.find(filter)
      .sort({ [sort]: sortDir })
      .skip((Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10))))
      .limit(Math.min(100, Math.max(1, parseInt(limit, 10))))
      .lean();

    res.json({
      statusCode: 200,
      data: { items, total, page: Math.max(1, parseInt(page, 10)), limit: Math.min(100, Math.max(1, parseInt(limit, 10))) }
    });
  } catch (err) {
    console.error('InfluencerLink list error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to list influencer links' } });
  }
};

// GET one (admin)
exports.getById = async (req, res) => {
  try {
    const link = await InfluencerLink.findById(req.params.id).lean();
    if (!link) return res.status(404).json({ statusCode: 404, data: { message: 'Influencer link not found' } });
    res.json({ statusCode: 200, data: link });
  } catch (err) {
    console.error('InfluencerLink getById error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to fetch influencer link' } });
  }
};

// POST create (admin)
exports.create = async (req, res) => {
  try {
    const { name, slug, targetUrl, description, originalPrice, discountPrice, status } = req.body;
    if (!name) return res.status(400).json({ statusCode: 400, data: { message: 'Name is required' } });

    const normalizedSlugVal = normalizeSlug(slug || name);
    if (!slugRegex.test(normalizedSlugVal)) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Slug must be alphanumeric with optional hyphens/underscores (e.g. rohitfit)' } });
    }

    const existing = await InfluencerLink.findOne({ slug: normalizedSlugVal });
    if (existing) return res.status(400).json({ statusCode: 400, data: { message: 'Slug already in use' } });

    const link = await InfluencerLink.create({
      name,
      slug: normalizedSlugVal,
      targetUrl: targetUrl || '/registration',
      description: description || '',
      originalPrice: originalPrice != null ? Number(originalPrice) : 1499,
      discountPrice: discountPrice != null ? Number(discountPrice) : 999,
      status: status === 'inactive' ? 'inactive' : 'active'
    });

    res.status(201).json({ statusCode: 201, data: link });
  } catch (err) {
    console.error('InfluencerLink create error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to create influencer link' } });
  }
};

// PUT update (admin)
exports.update = async (req, res) => {
  try {
    const { name, slug, targetUrl, description, originalPrice, discountPrice, status } = req.body;
    const link = await InfluencerLink.findById(req.params.id);
    if (!link) return res.status(404).json({ statusCode: 404, data: { message: 'Influencer link not found' } });

    if (name !== undefined) link.name = name;
    if (targetUrl !== undefined) link.targetUrl = targetUrl;
    if (description !== undefined) link.description = description;
    if (originalPrice !== undefined) link.originalPrice = Number(originalPrice);
    if (discountPrice !== undefined) link.discountPrice = Number(discountPrice);
    if (status !== undefined) link.status = status === 'inactive' ? 'inactive' : 'active';

    if (slug !== undefined) {
      const normalizedSlugVal = normalizeSlug(slug);
      if (!slugRegex.test(normalizedSlugVal)) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Invalid slug format' } });
      }
      const existing = await InfluencerLink.findOne({ slug: normalizedSlugVal, _id: { $ne: link._id } });
      if (existing) return res.status(400).json({ statusCode: 400, data: { message: 'Slug already in use' } });
      link.slug = normalizedSlugVal;
    }

    await link.save();
    res.json({ statusCode: 200, data: link });
  } catch (err) {
    console.error('InfluencerLink update error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to update influencer link' } });
  }
};

// DELETE (admin)
exports.remove = async (req, res) => {
  try {
    const link = await InfluencerLink.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ statusCode: 404, data: { message: 'Influencer link not found' } });
    res.json({ statusCode: 200, data: { message: 'Deleted' } });
  } catch (err) {
    console.error('InfluencerLink remove error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to delete influencer link' } });
  }
};

// GET analytics (admin) – list with conversion/revenue
exports.analytics = async (req, res) => {
  try {
    const { sortBy = 'totalClicks', order = 'desc' } = req.query;
    const links = await InfluencerLink.find({}).lean().sort({ [sortBy]: order === 'asc' ? 1 : -1 });
    const rows = links.map((l) => ({
      _id: l._id,
      name: l.name,
      slug: l.slug,
      totalClicks: l.totalClicks || 0,
      totalRegistrations: l.totalRegistrations || 0,
      totalPayments: l.totalPayments || 0,
      totalRevenue: l.totalRevenue || 0,
      conversionRate: l.totalClicks ? ((l.totalRegistrations || 0) / l.totalClicks * 100).toFixed(2) + '%' : '0%',
      status: l.status,
      createdAt: l.createdAt
    }));
    res.json({ statusCode: 200, data: rows });
  } catch (err) {
    console.error('InfluencerLink analytics error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to fetch analytics' } });
  }
};

// Record click and return redirect URL (for frontend /i/:slug or API)
exports.trackAndRedirect = async (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Invalid slug' } });
    }

    const link = await InfluencerLink.findOne({ slug, status: 'active' });
    if (!link) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Influencer link not found or inactive' } });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(404).json({ statusCode: 404, data: { message: 'Influencer link has expired' } });
    }

    const trackingId = req.query.tid || req.body?.trackingId || req.headers['x-tracking-id'] || null;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
    const ua = (req.headers['user-agent'] || '').slice(0, 512);

    // Optional: prevent duplicate count per trackingId (upsert)
    if (trackingId) {
      const existing = await InfluencerTracking.findOne({ influencerLinkId: link._id, trackingId });
      if (!existing) {
        await InfluencerTracking.create({
          influencerLinkId: link._id,
          trackingId,
          ipAddress: ip,
          userAgent: ua
        });
        await InfluencerLink.findByIdAndUpdate(link._id, { $inc: { totalClicks: 1 } });
      }
    } else {
      await InfluencerTracking.create({
        influencerLinkId: link._id,
        ipAddress: ip,
        userAgent: ua
      });
      await InfluencerLink.findByIdAndUpdate(link._id, { $inc: { totalClicks: 1 } });
    }

    const baseUrl = (link.targetUrl || '/registration').replace(/\?.*$/, '');
    const sep = baseUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${baseUrl}${sep}ref=${encodeURIComponent(link.slug)}`;

    res.json({
      statusCode: 200,
      data: { redirectUrl, slug: link.slug }
    });
  } catch (err) {
    console.error('InfluencerLink trackAndRedirect error:', err);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to process link' } });
  }
};

// Server-side redirect (for GET /i/:slug when request hits backend)
exports.redirect = async (req, res) => {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();
    if (!slugRegex.test(slug)) {
      return res.redirect(302, '/registration');
    }

    const link = await InfluencerLink.findOne({ slug, status: 'active' });
    if (!link) return res.redirect(302, '/registration');

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.redirect(302, '/registration');
    }

    const trackingId = req.query.tid || null;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
    const ua = (req.headers['user-agent'] || '').slice(0, 512);

    if (trackingId) {
      const existing = await InfluencerTracking.findOne({ influencerLinkId: link._id, trackingId });
      if (!existing) {
        await InfluencerTracking.create({ influencerLinkId: link._id, trackingId, ipAddress: ip, userAgent: ua });
        await InfluencerLink.findByIdAndUpdate(link._id, { $inc: { totalClicks: 1 } });
      }
    } else {
      await InfluencerTracking.create({ influencerLinkId: link._id, ipAddress: ip, userAgent: ua });
      await InfluencerLink.findByIdAndUpdate(link._id, { $inc: { totalClicks: 1 } });
    }

    const baseUrl = (link.targetUrl || '/registration').replace(/\?.*$/, '');
    const sep = baseUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${baseUrl}${sep}ref=${encodeURIComponent(link.slug)}`;
    res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('InfluencerLink redirect error:', err);
    res.redirect(302, '/registration');
  }
};

// Check slug availability (admin)
exports.checkSlug = async (req, res) => {
  try {
    const slug = normalizeSlug(req.query.slug || req.params.slug);
    if (!slugRegex.test(slug)) {
      return res.json({ statusCode: 200, data: { available: false, message: 'Invalid slug format' } });
    }
    const existing = await InfluencerLink.findOne({ slug });
    res.json({ statusCode: 200, data: { available: !existing, slug } });
  } catch (err) {
    res.status(500).json({ statusCode: 500, data: { message: 'Check failed' } });
  }
};
