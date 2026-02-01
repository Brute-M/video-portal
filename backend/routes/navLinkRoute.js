const express = require('express');
const router = express.Router();
const navigateController = require('../controller/navLinkController');

router.get('/', navigateController.getAllNavLinks);
router.post('/', navigateController.createNavLink);
router.put('/:id', navigateController.updateNavLink);
router.delete('/:id', navigateController.deleteNavLink);
router.post('/reorder', navigateController.reorderNavLinks);

module.exports = router;
