const express = require('express');
const router = express.Router();
const ctrl = require('../controller/registrationFaqController');
const authenticate = require('../middleware/authMiddleware');

// Public
router.get('/', ctrl.getFaqs);

// Admin
router.get('/all', authenticate, ctrl.getAllFaqs);
router.get('/settings', authenticate, ctrl.getSettings);
router.put('/settings', authenticate, ctrl.updateSettings);
router.post('/', authenticate, ctrl.createFaq);
router.put('/:id', authenticate, ctrl.updateFaq);
router.delete('/:id', authenticate, ctrl.deleteFaq);

module.exports = router;
