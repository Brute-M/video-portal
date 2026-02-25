const express = require('express');
const router = express.Router();
const sitemapController = require('../controller/sitemapController');

router.get('/sitemap.xml', sitemapController.getSitemap);
router.get('/robots.txt', sitemapController.getRobots);

module.exports = router;
