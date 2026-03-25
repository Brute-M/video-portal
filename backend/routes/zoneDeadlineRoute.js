const express = require('express');
const router = express.Router();
const ctrl = require('../controller/zoneDeadlineController');
const authenticate = require('../middleware/authMiddleware');

// Public: get settings
router.get('/', ctrl.getSettings);

// Admin: update settings
router.put('/settings', authenticate, ctrl.updateSettings);

module.exports = router;
