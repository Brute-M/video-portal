const express = require('express');
const router = express.Router();
const influencerLinkController = require('../controller/influencerLinkController');
const authenticate = require('../middleware/authMiddleware');

// Public: track click and get redirect URL (POST for body, GET with slug in path)
router.get('/track/:slug', influencerLinkController.trackAndRedirect);
router.post('/track/:slug', influencerLinkController.trackAndRedirect);

// Public: fetch dynamic amount for a slug (e.g. /api/influencer-links/amount/test -> 999)
router.get('/amount/:slug', influencerLinkController.getAmountBySlug);

// Admin CRUD (protect with auth)
router.get('/', authenticate, influencerLinkController.list);
router.get('/analytics', authenticate, influencerLinkController.analytics);
router.get('/check-slug', authenticate, influencerLinkController.checkSlug);
router.get('/:id', authenticate, influencerLinkController.getById);
router.post('/', authenticate, influencerLinkController.create);
router.put('/:id', authenticate, influencerLinkController.update);
router.delete('/:id', authenticate, influencerLinkController.remove);

module.exports = router;
