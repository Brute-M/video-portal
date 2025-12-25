const express = require('express');
const router = express.Router();
const { login } = require('../controller/authController'); // Reuse existing login logic
const { adminLandingLogin, getAllRecords, getPaginatedRecords, getAdminStats } = require('../controller/adminController');
const authenticate = require('../middleware/authMiddleware');

// Admin Login (using same auth logic, strictly for admin creds)
router.post('/login', login);

// Admin Landing Login (fixed credentials)
router.post('/landing/login', adminLandingLogin);

// Fetch All Data (Protected)
router.get('/users', authenticate, getAllRecords);

router.get('/stats', authenticate, getAdminStats);
router.get('/records', authenticate, getPaginatedRecords);

module.exports = router;
