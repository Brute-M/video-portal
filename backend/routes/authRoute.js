const express = require('express');
const router = express.Router();
const { login, register, upload, sendOtp, verifyOtp, forgotPassword, resetPassword, registerCoach, loginCoach, resendWelcomeEmail, getPartnerProfile, getCoachMyPlayers, trackVisit, getVisits } = require('../controller/authController');
const authenticate = require('../middleware/authMiddleware');
const User = require('../model/user.model');

router.post('/login', login);

// 'trail_video' is the field name for the file
router.post('/register', upload.single('trail_video'), register);

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Coach & Influencer Routes
router.post('/register-coach', upload.single('image'), registerCoach);
router.post('/login-coach', loginCoach);
router.post('/resend-welcome-email', resendWelcomeEmail);
router.post('/track-visit', trackVisit);
router.get('/partner/profile', authenticate, getPartnerProfile);
router.get('/coach/my-players', authenticate, getCoachMyPlayers);
router.get('/visits', getVisits);

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    console.log(user)
    if (!user) {
      return res.status(404).json({ statusCode: 404, data: { message: 'User not found' } });
    }
    res.json({ statusCode: 200, data: { userId: user._id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, data: { message: 'Error fetching user profile' } });
  }
});

module.exports = router;
