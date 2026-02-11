const express = require('express');
const router = express.Router();
const faqController = require('../controller/faqController');

router.post('/create', faqController.createFAQ);
router.get('/', faqController.getFAQs);
router.put('/:id', faqController.updateFAQ);
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;
