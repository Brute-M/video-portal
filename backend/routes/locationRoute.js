const express = require('express');
const router = express.Router();
const locationController = require('../controller/locationController');

router.get('/', locationController.getLocations);
router.get('/states', locationController.getStates);
router.get('/districts/:stateId', locationController.getDistricts);

module.exports = router;
