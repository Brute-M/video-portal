const express = require('express');
const router = express.Router();
const { login, register, upload, uploadProfileImage, uploadProfileImageHandler, sendOtp, verifyOtp, forgotPassword, resetPassword, registerCoach, loginCoach, resendWelcomeEmail, getPartnerProfile, getCoachMyPlayers, trackVisit, getVisits, saveStep1Data, storeSyncData, createSystemUser, updateSystemUser, deleteSystemUser } = require('../controller/authController');
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
router.post('/step1-lead', saveStep1Data);
router.post('/store-sync-data', storeSyncData);
router.post('/create-system-user', authenticate, createSystemUser);
router.put('/update-system-user', authenticate, updateSystemUser);
router.delete('/delete-system-user/:id', authenticate, deleteSystemUser);
router.post('/update-profile', authenticate, require('../controller/authController').updateProfile);
router.post('/upload-profile-image', authenticate, uploadProfileImage.single('profileImage'), uploadProfileImageHandler);
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
    res.json({
      statusCode: 200,
      data: {
        userId: user._id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        mobile: user.mobile,
        isFromLandingPage: user.isFromLandingPage,
        isPaid: user.isPaid || !!user.paymentId,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    console.log('error');
    res.status(500).json({ statusCode: 500, data: { message: 'Error fetching user profile' } });
  }
});

module.exports = router;
