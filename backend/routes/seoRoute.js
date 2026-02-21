const express = require('express');
const router = express.Router();
const { getAllSeoMeta, getSeoMetaByPath, updateSeoMeta } = require('../controller/seoMetaController');
const authenticate = require('../middleware/authMiddleware');

router.get('/meta/all', authenticate, getAllSeoMeta);
router.get('/meta/dynamic', getSeoMetaByPath); // public endpoint for frontend generic access
router.put('/meta', authenticate, updateSeoMeta); // Create or Update
router.post('/meta', authenticate, updateSeoMeta); // Create or Update Support

module.exports = router;
