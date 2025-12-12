const express = require('express');
const router = express.Router();
const locationController = require('../controller/locationController');

router.get('/', locationController.getLocations);

module.exports = router;
