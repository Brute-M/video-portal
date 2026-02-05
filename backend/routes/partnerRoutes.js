const express = require('express');
const router = express.Router();
const partnerController = require('../controller/partnerController');

router.post('/', partnerController.createPartner);
router.get('/', partnerController.getAllPartners);

module.exports = router;
