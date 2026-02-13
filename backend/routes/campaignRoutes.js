const express = require('express');
const router = express.Router();
const campaignController = require('../controller/campaignController');
// const { isAdmin } = require('../middleware/adminMiddleware'); // Middleware removed as file doesn't exist

// Protect these routes
// router.use(isAdmin); // Add authentication

router.post('/create', campaignController.createCampaign);
router.get('/', campaignController.getCampaigns);
router.delete('/:id', campaignController.deleteCampaign);
router.put('/:id', campaignController.updateCampaign);

module.exports = router;
