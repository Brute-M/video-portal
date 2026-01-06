const User = require('../model/user.model');
const Coach = require('../model/coach.model');
const Influencer = require('../model/influencer.model');
const Otp = require('../model/otp.model');
const Visit = require('../model/visit.model');
const Step1Lead = require('../model/step1_lead.model');
const Coupon = require('../model/coupon.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Multer config for trail video
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/**
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for hardcoded Admin credentials
    if (email === 'admin@brpl.com' && password === 'admin123') {
      const token = jwt.sign({ userId: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({
        statusCode: 200,
        data: {
          message: 'Admin Login successful',
          userId: 'admin',
          email: 'admin@brpl.com',
          role: 'admin',
          token
        }
      });
    }

    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid email or password' } });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch)
    if (!isMatch) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid email or password' } });
    }

    const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      statusCode: 200,
      data: {
        message: 'Login successful',
        userId: user._id,
        email: user.email,
        role: 'user',
        token
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
}

const register = async (req, res) => {
  // Note: req.body will contain text fields, req.file will contain the file
  try {
    const {
      fname, lname, email, password, mobile, otp,
      gender, zone_id, city, state, pincode,
      address1, address2, aadhar, playerRole,
      isFromLandingPage, paymentAmount, paymentId,
      referralCodeUsed, trackingId, fbclid,
      couponCode
    } = req.body;

    if (!email || !password || !fname || !mobile) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Required fields are missing' } });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Email is already taken' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let trail_video_path = null;
    if (req.file) {
      trail_video_path = req.file.path;
    }

    let normalizedReferralCode = referralCodeUsed ? String(referralCodeUsed).trim().toUpperCase() : '';
    let referralSourceRole = undefined;
    let referralSourceId = undefined;
    let conversionType = 'none'; // Default

    // Fallback / Tracking Logic
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const clientUa = req.headers['user-agent'];
    let matchedVisit = null;

    if (normalizedReferralCode) {
      conversionType = 'code';
    } else {
      // Try to find a visit to attribute this registration to
      // 1. By Tracking ID
      if (trackingId) {
        matchedVisit = await Visit.findOne({ trackingId }).sort({ createdAt: -1 });
      }

      // 2. By IP + User Agent (within 60 mins)
      if (!matchedVisit) {
        const timeWindow = new Date(Date.now() - 60 * 60 * 1000);
        const criteria = {
          ipAddress: clientIp,
          userAgent: clientUa,
          createdAt: { $gte: timeWindow }
        };
        // If fbclid is present, use it to strict match
        if (fbclid) criteria.fbclid = fbclid;

        matchedVisit = await Visit.findOne(criteria).sort({ createdAt: -1 });
      }

      if (matchedVisit) {
        conversionType = 'fallback';
        // If the visit had a code, we can inherit it
        if (matchedVisit.referralCode) {
          normalizedReferralCode = matchedVisit.referralCode;
        }
      } else {
        conversionType = 'organic';
      }
    }

    if (normalizedReferralCode) {
      const coachSource = await Coach.findOne({ referralCode: normalizedReferralCode }).select('_id');
      if (coachSource) {
        referralSourceRole = 'coach';
        referralSourceId = coachSource._id;
      } else {
        const influencerSource = await Influencer.findOne({ referralCode: normalizedReferralCode }).select('_id');
        if (influencerSource) {
          referralSourceRole = 'influencer';
          referralSourceId = influencerSource._id;
        } else {
          return res.status(400).json({
            statusCode: 400,
            data: { message: 'Invalid referral code' }
          });
        }
      }
    }

    let normalizedCouponCode = couponCode ? String(couponCode).trim().toUpperCase() : '';
    let appliedCouponBenefits = [];
    let matchedCoupon = null;

    if (normalizedCouponCode) {
      matchedCoupon = await Coupon.findOne({ code: normalizedCouponCode, isActive: true });
      if (!matchedCoupon) {
        return res.status(400).json({
          statusCode: 400,
          data: { message: 'Invalid coupon code' }
        });
      }
      appliedCouponBenefits = Array.isArray(matchedCoupon.benefits) ? matchedCoupon.benefits : [];
    }

    const newUser = new User({
      fname, lname, email, password: hashedPassword,
      mobile, otp, gender, zone_id, city, state, pincode,
      address1, address2, aadhar,
      trail_video: trail_video_path,
      playerRole,
      isFromLandingPage: String(isFromLandingPage).toLowerCase() === 'true',
      paymentAmount,
      paymentId,
      referralCodeUsed: normalizedReferralCode || undefined,
      referralSourceRole,
      referralSourceId,
      couponCodeUsed: normalizedCouponCode || undefined,
      couponBenefits: appliedCouponBenefits,
      isPaid: !!paymentId, // Set isPaid to true if paymentId is present
      ipAddress: clientIp,
      userAgent: clientUa,
      fbclid: fbclid || (matchedVisit ? matchedVisit.fbclid : undefined),
      trackingId: trackingId || (matchedVisit ? matchedVisit.trackingId : undefined),
      conversionType
    });

    await newUser.save();

    if (matchedCoupon) {
      matchedCoupon.usedCount = (matchedCoupon.usedCount || 0) + 1;
      matchedCoupon.usedBy = matchedCoupon.usedBy || [];
      matchedCoupon.usedBy.push(newUser._id);
      await matchedCoupon.save();
    }

    // Mark visit as converted if matched
    if (matchedVisit) {
      matchedVisit.converted = true;
      matchedVisit.userId = newUser._id;
      await matchedVisit.save();
    }

    // Send Registration Success Email if from landing page
    if (String(isFromLandingPage).toLowerCase() === 'true') {
      try {
        const { sendUserRegistrationSuccessEmail } = require('../utils/emailService');
        await sendUserRegistrationSuccessEmail(newUser.email, `${newUser.fname} ${newUser.lname || ''}`, password);
      } catch (emailError) {
        console.error('Registration success email failed (registration will continue):', emailError);
      }
    }

    res.status(201).json({
      statusCode: 201,
      data: {
        message: 'Registration successful',
        userId: newUser._id,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
}



// ... (existing imports if any)

const sendOtp = async (req, res) => {
  try {
    const { mobile, checkExisting } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    if (checkExisting) {
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(400).json({ message: "Mobile number already exists please login." });
      }
    }

    // Generate 4 digit random OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save to DB (upsert or delete old first)
    await Otp.deleteMany({ mobile }); // Clear old OTPs
    await Otp.create({ mobile, otp });

    // Send Real OTP via SMS API
    const { sendSmsOtp } = require('../utils/smsService');
    await sendSmsOtp(mobile, otp);

    console.log(`OTP generated for ${mobile}: ${otp}`);

    res.status(200).json({
      message: "OTP sent successfully",
      success: true,
      // Removed OTP from response to ensure real testing
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

const getCoachMyPlayers = async (req, res) => {
  try {
    if (req.role !== 'coach' && req.role !== 'influencer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
    const search = (req.query.search || '').toString().trim();

    const filter = {
      referralSourceRole: req.role,
      referralSourceId: req.userId
    };

    if (search) {
      // eslint-disable-next-line no-useless-escape
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);
    const skip = (safePage - 1) * limit;

    const items = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      statusCode: 200,
      data: {
        items,
        pagination: {
          page: safePage,
          limit,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching coach players:', error);
    return res.status(500).json({ message: 'Server error fetching players' });
  }
};

const getPartnerProfile = async (req, res) => {
  try {
    if (req.role !== 'coach' && req.role !== 'influencer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const Model = req.role === 'coach' ? Coach : Influencer;
    const entity = await Model.findById(req.userId).select('-password');

    if (!entity) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      data: {
        id: entity._id,
        role: entity.role,
        name: entity.name,
        email: entity.email,
        mobile: entity.mobile,
        address: entity.address,
        image: entity.image,
        referralCode: entity.referralCode,
        academyName: entity.academyName,
        numberOfPlayers: entity.numberOfPlayers
      }
    });
  } catch (error) {
    console.error('Get Partner Profile Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resendWelcomeEmail = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (role && role !== 'coach' && role !== 'influencer') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const Model = role === 'coach' ? Coach : role === 'influencer' ? Influencer : null;

    let entity = null;
    let resolvedRole = role;

    if (Model) {
      entity = await Model.findOne({ email });
    } else {
      entity = await Coach.findOne({ email });
      resolvedRole = 'coach';
      if (!entity) {
        entity = await Influencer.findOne({ email });
        resolvedRole = 'influencer';
      }
    }

    if (!entity) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!entity.referralCode) {
      return res.status(400).json({ message: 'Referral code not found for this user' });
    }

    const { sendWelcomeEmail } = require('../utils/emailService');
    await sendWelcomeEmail(entity.email, entity.name, entity.referralCode, resolvedRole);

    return res.status(200).json({
      message: 'Welcome email sent successfully',
      data: {
        email: entity.email,
        role: resolvedRole
      }
    });
  } catch (error) {
    console.error('Resend Welcome Email Error:', error);
    return res.status(500).json({ message: 'Failed to send welcome email', error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP are required" });
    }

    const record = await Otp.findOne({ mobile, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP", success: false });
    }

    // OTP valid - optionally delete it to prevent reuse
    await Otp.deleteOne({ _id: record._id });

    const existingUser = await User.findOne({ mobile });

    res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      isAlreadyRegistered: !!existingUser,
      isPaid: existingUser ? (existingUser.isPaid || !!existingUser.paymentId) : false
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit random OTP

    // Save/Update OTP
    await Otp.deleteMany({ email }); // Clear old
    await Otp.create({ email, otp });

    // Send Email
    // Importing here to avoid circular dependency issues if any, though likely fine at top
    // assuming sendPasswordResetEmail is imported at top or we import it here
    const { sendPasswordResetEmail } = require('../utils/emailService');
    await sendPasswordResetEmail(email, otp, user.fname);

    console.log(`Reset OTP for ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email"
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to process request", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and New Password are required" });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { password: hashedPassword });

    // Cleanup OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};

// --- Coach & Influencer Auth ---

const registerCoach = async (req, res) => {
  try {
    const {
      role, name, mobile, address, academyName, numberOfPlayers, email, password
    } = req.body;

    if (!role || !name || !mobile || !email || !password) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Role validation
    if (role !== 'coach' && role !== 'influencer') {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists in the specific collection
    const Model = role === 'coach' ? Coach : Influencer;
    const existingUser = await Model.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} with this email already exists` });
    }

    // Handle Image Upload
    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path;
    } else {
      return res.status(400).json({ message: "Profile image is required" });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Referral Code
    const generateReferralCode = (len = 6) => {
      return crypto.randomBytes(Math.ceil(len * 0.75)).toString('base64url').toUpperCase().slice(0, len);
    };

    const generateUniqueReferralCode = async () => {
      for (let i = 0; i < 15; i++) {
        const code = generateReferralCode(6);
        const existsInCoach = await Coach.exists({ referralCode: code });
        if (existsInCoach) continue;
        const existsInInfluencer = await Influencer.exists({ referralCode: code });
        if (existsInInfluencer) continue;
        return code;
      }
      throw new Error('Failed to generate unique referral code');
    };

    const referralCode = await generateUniqueReferralCode();

    const newEntity = new Model({
      role,
      name,
      mobile,
      email,
      password: hashedPassword,
      address,
      image: imagePath,
      referralCode,
      ...(role === 'coach' && { academyName, numberOfPlayers })
    });

    await newEntity.save();

    // Send Welcome Email
    try {
      const { sendWelcomeEmail } = require('../utils/emailService');
      await sendWelcomeEmail(email, name, referralCode, role);
    } catch (emailError) {
      console.error('Welcome email failed (registration will continue):', emailError);
    }

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      data: {
        id: newEntity._id,
        email: newEntity.email,
        role: newEntity.role,
        referralCode: newEntity.referralCode
      }
    });

  } catch (error) {
    console.error("Coach/Influencer Registration Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginCoach = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check Coach first
    let user = await Coach.findOne({ email });
    let role = 'coach';

    // If not coach, check Influencer
    if (!user) {
      user = await Influencer.findOne({ email });
      role = 'influencer';
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        image: user.image
      }
    });

  } catch (error) {
    console.error("Coach/Influencer Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const trackVisit = async (req, res) => {
  try {
    const { trackingId, ipAddress, userAgent, fbclid, referralCode, trackend } = req.body;

    // Fallback IP/UA if not sent in body
    const finalIp = ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const finalUa = userAgent || req.headers['user-agent'];

    const newVisit = new Visit({
      trackingId,
      ipAddress: finalIp,
      userAgent: finalUa,
      fbclid,
      referralCode,
      trackend,
      converted: false
    });

    await newVisit.save();

    res.status(200).json({ success: true, message: 'Visit tracked' });
  } catch (error) {
    console.error("Track Visit Error:", error);
    res.status(500).json({ success: false, message: 'Failed to track visit' });
  }
};

const getVisits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const visits = await Visit.find()
      .populate('userId', 'fname lname email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Visit.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        items: visits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Get Visits Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch visits" });
  }
};



const saveStep1Data = async (req, res) => {
  try {
    const { name, mobile, role, state, city, trackingId } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    // Upsert the lead data
    await Step1Lead.findOneAndUpdate(
      { mobile },
      {
        name,
        role,
        state,
        city,
        trackingId,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: 'Step 1 data saved' });
  } catch (error) {
    console.error('Save Step 1 Data Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save step 1 data' });
  }
};

const getStep1Leads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = (req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Step1Lead.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Step1Lead.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        items: leads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Step 1 Leads Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
};

module.exports = {
  login,
  register,
  upload,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  registerCoach,
  loginCoach,
  resendWelcomeEmail,
  getPartnerProfile,
  getCoachMyPlayers,
  trackVisit,
  getVisits,
  saveStep1Data,
  getStep1Leads
};
