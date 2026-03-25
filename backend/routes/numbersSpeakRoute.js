const express = require('express');
const router = express.Router();
const ctrl = require('../controller/numbersSpeakController');
const authenticate = require('../middleware/authMiddleware');

// Public: get active items only
router.get('/', ctrl.getItems);

// Admin: get all (including inactive)
router.get('/all', authenticate, ctrl.getAllItems);

// Admin: settings
router.get('/settings', authenticate, ctrl.getSettings);
router.put('/settings', authenticate, ctrl.updateSettings);

// Admin: CRUD
router.post('/', authenticate, ctrl.createItem);
router.put('/:id', authenticate, ctrl.updateItem);
router.delete('/:id', authenticate, ctrl.deleteItem);

module.exports = router;
