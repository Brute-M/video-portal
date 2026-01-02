const express = require('express');
const router = express.Router();
const { login, getStep1Leads } = require('../controller/authController'); // Reuse existing login logic
const { adminLandingLogin, getAllRecords, getPaginatedRecords, getAdminStats, getDashboardChartData, downloadUserInvoice, getPayments } = require('../controller/adminController');
const authenticate = require('../middleware/authMiddleware');

// Admin Login (using same auth logic, strictly for admin creds)
router.post('/login', login);

// Admin Landing Login (fixed credentials)
router.post('/landing/login', adminLandingLogin);

// Fetch All Data (Protected)
router.get('/users', authenticate, getAllRecords);

router.get('/stats', authenticate, getAdminStats);
router.get('/records', authenticate, getPaginatedRecords);
router.get('/step1-leads', authenticate, getStep1Leads);
router.get('/charts', authenticate, getDashboardChartData);
// Invoice Download
router.get('/invoice/:userId', authenticate, downloadUserInvoice);

// Payments Tracking
router.get('/payments', authenticate, getPayments);

module.exports = router;
