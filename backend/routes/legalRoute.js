const router = require('express').Router();
const legalPageController = require('../controller/legalPageController');
const authenticate = require('../middleware/authMiddleware');

router.get('/:key', legalPageController.getByKey);
router.put('/:key', authenticate, legalPageController.updateByKey);

module.exports = router;
