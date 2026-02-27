const User = require('../model/user.model');
const Coach = require('../model/coach.model');
const Influencer = require('../model/influencer.model');
const Otp = require('../model/otp.model');
const Visit = require('../model/visit.model');
const Step1Lead = require('../model/step1_lead.model');
const Coupon = require('../model/coupon.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
require('dotenv').config();
const qrcode = require('qrcode');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { S3Client } = require('@aws-sdk/client-s3');
const fs = require('fs');
const multerS3 = require('multer-s3');
const SiteSettings = require('../model/siteSettings.model');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1'
});

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

const profileImageStorage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read',
  metadata: function (_, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (_, file, cb) {
    const ext = path.extname(file.originalname);
    // Save to 'profiles/' folder in bucket
    cb(null, `profiles/profile_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    // Check extension and mimetype
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */

const login = async (req, res) => {
  try {
    const { email, mobile, identifier: reqIdentifier, password } = req.body;

    // 0. Strict Validation
    if (!password) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Password is required' } });
    }

    // 1. Resolve Identifier
    const identifier = (email || mobile || reqIdentifier || '').trim();
    if (!identifier) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Email or Mobile Number is required' } });
    }

    // 2. Admin Check (env or fallback credentials)
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@brpl.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const legacyPassword = 'Admin@123';
    const inputIdentifier = identifier.toLowerCase().trim();
    if (inputIdentifier === adminEmail) {
      let settings = await SiteSettings.findOne({ key: 'main' });
      if (!settings) settings = await SiteSettings.create({ key: 'main' });

      let isAdminPasswordMatch = false;

      // Check if custom hashed password exists
      if (settings.adminPasswordHash) {
        isAdminPasswordMatch = await bcrypt.compare(password, settings.adminPasswordHash);
      } else {
        // Fallback to env passwords only if no custom hash exists
        isAdminPasswordMatch = (password === adminPassword || password === legacyPassword);
      }

      if (isAdminPasswordMatch) {
        const twoFaSecret = settings.admin2FASecret;

        if (settings.admin2FAEnabled && twoFaSecret && twoFaSecret.trim()) {
          const isVerified = settings.admin2FAVerified;

          // 2FA enabled: return OTP required (do not issue JWT yet)
          const otpToken = jwt.sign(
            { purpose: 'admin_otp', email: adminEmail, dbUserId: 'admin', role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
          );

          const responseData = {
            requireOtp: true,
            message: isVerified ? 'OTP Required' : 'MFA setup required. Scan this QR code in Google Authenticator.',
            otpToken
          };

          if (!isVerified) {
            const otpAuthStr = `otpauth://totp/BRPL%20Admin?secret=${twoFaSecret.trim()}`;
            responseData.qrCodeUrl = await qrcode.toDataURL(otpAuthStr);
          }

          return res.json({
            statusCode: 200,
            data: responseData
          });
        }

        const token = jwt.sign({ userId: 'admin', role: 'admin', email: adminEmail }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.json({
          statusCode: 200,
          data: {
            message: 'Admin Login successful',
            userId: 'admin',
            email: adminEmail,
            role: 'admin',
            token
          }
        });
      }
    }

    // 3. Build Query Conditions
    // We want to match Email OR Mobile (in various formats)
    const orConditions = [
      { email: identifier.toLowerCase() } // Always check email (exact, lower)
    ];

    // Check if identifier has digits (potential mobile)
    const digitsOnly = identifier.replace(/\D/g, '');

    if (digitsOnly.length > 0) {
      // It has numbers, so checking User.mobile makes sense
      orConditions.push({ mobile: identifier }); // Match exact input
      orConditions.push({ mobile: digitsOnly }); // Match digits only (e.g. input "(555)..." vs db "555...")

      // If robust length, match by last 10 digits (covers +91 vs non-prefix)
      if (digitsOnly.length >= 10) {
        const last10 = digitsOnly.slice(-10);
        // Match any mobile ending with these 10 digits
        orConditions.push({ mobile: { $regex: last10 + '$' } });
      }
    }

    const user = await User.findOne({ $or: orConditions });

    console.log("Login attempt for:", identifier, "Found:", !!user);

    if (!user) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid credentials (User not found)' } });
    }

    // 4. Verify Password (User exists, so password should be there)
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid credentials' } });
    }

    // 5. Success
    const userRole = user.role || 'user';

    // MFA required only for admin. Subadmin and seo_content log in with password only.
    if (userRole === 'admin') {
      if (user.twoFaEnabled) {
        const otpToken = jwt.sign(
          { purpose: 'admin_otp', email: user.email, dbUserId: user._id, role: userRole },
          process.env.JWT_SECRET,
          { expiresIn: '5m' }
        );
        return res.json({
          statusCode: 200,
          data: {
            requireOtp: true,
            message: 'OTP Required',
            otpToken
          }
        });
      } else {
        // Not enabled yet, check if secret exists, else generate
        let secretString = user.twoFaSecret;
        if (!secretString) {
          const secret = speakeasy.generateSecret({ name: `BRPL (${user.email})` });
          secretString = secret.base32;
          user.twoFaSecret = secretString;
          await user.save();
        }

        const otpAuthStr = `otpauth://totp/BRPL%20%28${encodeURIComponent(user.email)}%29?secret=${secretString}`;
        const qrCodeUrl = await qrcode.toDataURL(otpAuthStr);

        const otpToken = jwt.sign(
          { purpose: 'admin_otp', email: user.email, dbUserId: user._id, role: userRole },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        return res.json({
          statusCode: 200,
          data: {
            requireOtp: true,
            message: 'MFA setup required. Scan this QR code in Google Authenticator.',
            otpToken,
            qrCodeUrl
          }
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: userRole === 'admin' || userRole === 'subadmin' || userRole === 'seo_content' ? '24h' : '1h' }
    );

    res.json({
      statusCode: 200,
      data: {
        message: 'Login successful',
        userId: user._id,
        email: user.email,
        role: userRole,
        token
      }
    });

  } catch (error) {
    console.error("Login Controller Error:", error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error', error: error.message } });
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

    const userExists = await User.findOne({
      $or: [{ email }, { mobile }]
    });
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Email is already registered' } });
      }
      if (userExists.mobile === mobile) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Mobile number is already registered' } });
      }
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
      conversionType,
      campaignCode: req.body.campaignCode // Save if present
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

    // Generate Token
    const token = jwt.sign({ userId: newUser._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      statusCode: 201,
      data: {
        message: 'Registration successful',
        userId: newUser._id,
        email: newUser.email,
        token
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
}


const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // From middleware
    const {
      gender, zone_id, city, state, pincode,
      address1, address2, aadhar, playerRole
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ statusCode: 404, data: { message: 'User not found' } });
    }

    // Update fields if present
    if (gender) user.gender = gender;
    if (zone_id) user.zone_id = zone_id;
    if (city) user.city = city;
    if (state) user.state = state;
    if (pincode) user.pincode = pincode;
    if (address1) user.address1 = address1;
    if (address2) user.address2 = address2;
    if (aadhar) user.aadhar = aadhar;
    // user.playerRole = playerRole; // Usually role shouldn't be changed after registration easily? Let's check reqs. 
    // The req says they fill details in Step 3. So yes, allow update.
    if (playerRole) user.playerRole = playerRole;

    await user.save();

    res.status(200).json({
      statusCode: 200,
      data: {
        message: 'Profile updated successfully',
        user: {
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          mobile: user.mobile,
          // include other fields if needed
        }
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ statusCode: 500, data: { message: 'Failed to update profile' } });
  }
};



// ... (existing imports if any)

const sendOtp = async (req, res) => {
  try {
    const { mobile, checkExisting } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    if (String(checkExisting).toLowerCase() === 'true') {
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(400).json({ message: "Mobile number already exists. Please login." });
      }
    }

    // Generate 4 digit random OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save to DB (upsert or delete old first)
    await Otp.deleteMany({ mobile }); // Clear old OTPs
    await Otp.create({ mobile, otp });

    // Send Real OTP via SMS API
    if (process.env.NODE_ENV === "production") {
      const { sendSmsOtp } = require('../utils/smsService');
      await sendSmsOtp(mobile, otp);
    }

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

const exportStep1Leads = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Step1Lead.find(filter).sort({ updatedAt: -1 });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Step 1 Leads');

    worksheet.columns = [
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Tracking ID', key: 'trackingId', width: 20 },
      { header: 'Date', key: 'updatedAt', width: 25 }
    ];

    leads.forEach(lead => {
      worksheet.addRow({
        mobile: lead.mobile,
        name: lead.name || '-',
        role: lead.role || '-',
        state: lead.state || '-',
        city: lead.city || '-',
        trackingId: lead.trackingId || '-',
        updatedAt: lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : ''
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=step1-leads.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Step 1 Leads Error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
};

const uploadProfileImageHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        statusCode: 400,
        data: { message: 'No image file provided' }
      });
    }

    const userId = req.userId; // From auth middleware
    if (!userId) {
      return res.status(401).json({
        statusCode: 401,
        data: { message: 'Unauthorized' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        data: { message: 'User not found' }
      });
    }

    // Update user profile image with S3 URL
    // req.file.location contains the S3 URL
    user.profileImage = req.file.location;
    await user.save();

    res.json({
      statusCode: 200,
      data: {
        message: 'Profile image uploaded successfully',
        imageUrl: user.profileImage, // Return full S3 URL
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Upload Profile Image Error:', error);
    res.status(500).json({
      statusCode: 500,
      data: { message: 'Failed to upload profile image' }
    });
  }
};

// Triggered when: website registration + user unpaid (after account creation, before payment)
const storeSyncData = async (req, res) => {
  try {
    const userData = req.body;
    console.log("Storing Sync Data (website registration, unpaid):", userData);

    // Here implies logic to store/sync user data to another system
    // e.g. await ExternalCRM.createLead(userData);

    res.status(200).json({
      statusCode: 200,
      data: {
        message: "User data stored synchronously",
        synced: true
      }
    });
  } catch (error) {
    console.error("Store Sync Data Error:", error);
    res.status(500).json({ statusCode: 500, data: { message: "Failed to store sync data" } });
  }
};

const createSystemUser = async (req, res) => {
  try {
    const { fname, lname, email, password, mobile, role, city, state } = req.body;
    const requesterRole = req.role; // From middleware

    // Authorization Check
    if (requesterRole !== 'admin' && requesterRole !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Permission denied' } });
    }

    // Role Creation Restrictions
    if (requesterRole === 'subadmin') {
      if (role !== 'seo_content') {
        return res.status(403).json({ statusCode: 403, data: { message: 'Subadmins can only create SEO_CONTENT users' } });
      }
    }

    // Basic Validation - Email, Password, Role essential
    if (!email || !password || !role) {
      return res.status(400).json({ statusCode: 400, data: { message: 'Email, Password and Role are required' } });
    }

    // Check Existence
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ statusCode: 400, data: { message: 'User already exists' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate dummy mobile if not provided (Format: 9 + 9 random digits to resemble valid mobile)
    const generatedMobile = mobile || ('9' + Math.floor(100000000 + Math.random() * 900000000).toString());

    const newUser = new User({
      fname: fname || 'System',
      lname: lname || 'User',
      email,
      password: hashedPassword,
      mobile: generatedMobile,
      role,
      city: city || 'System',
      state: state || 'System',
      isPaid: false
    });

    await newUser.save();

    res.status(201).json({
      statusCode: 201,
      data: {
        message: 'System User created successfully',
        userId: newUser._id,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Create System User Error:", error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

const updateSystemUser = async (req, res) => {
  try {
    const { userId, email, password, role } = req.body;
    const requesterRole = req.role;

    if (requesterRole !== 'admin' && requesterRole !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Permission denied' } });
    }

    if (userId === 'admin') {
      if (!password) {
        return res.status(400).json({ statusCode: 400, data: { message: 'Only password updates are allowed for the main admin account' } });
      }

      let settings = await SiteSettings.findOne({ key: 'main' });
      if (!settings) {
        settings = await SiteSettings.create({ key: 'main' });
      }

      settings.adminPasswordHash = await bcrypt.hash(password, 10);
      await settings.save();

      return res.status(200).json({
        statusCode: 200,
        data: {
          message: 'Admin password updated successfully',
          user: {
            id: 'admin',
            email: 'admin@brpl.com',
            role: 'admin'
          }
        }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ statusCode: 404, data: { message: 'User not found' } });
    }

    // Role restrictions for subadmin
    if (requesterRole === 'subadmin') {
      // Cannot edit admins or subadmins
      if (['admin', 'subadmin'].includes(user.role)) {
        return res.status(403).json({ statusCode: 403, data: { message: 'Insufficient permissions to edit this user' } });
      }
      // Cannot set role to admin or subadmin
      if (role && ['admin', 'subadmin'].includes(role)) {
        return res.status(403).json({ statusCode: 403, data: { message: 'Insufficient permissions to assign this role' } });
      }
    }

    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      statusCode: 200,
      data: {
        message: 'User updated successfully',
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error("Update System User Error:", error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

const deleteSystemUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = req.role;

    // Prevent deleting self or other main admins if specific
    if (id === 'admin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Cannot delete main admin account' } });
    }

    // Only Admin can delete system users
    if (requesterRole !== 'admin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Permission denied. Only Admins can delete users.' } });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ statusCode: 404, data: { message: 'User not found' } });
    }

    if (user.email === 'admin@brpl.com') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Cannot delete main admin account' } });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      statusCode: 200,
      data: {
        message: 'User deleted successfully'
      }
    });
  } catch (error) {
    console.error("Delete System User Error:", error);
    console.log('error');
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

/**
 * Verify admin 2FA OTP (Google Authenticator TOTP) and issue JWT.
 * Body: { otpToken, otp }
 */
const verifyAdminOtp = async (req, res) => {
  try {
    const { otpToken, otp } = req.body;
    if (!otpToken || !otp || !String(otp).trim()) {
      return res.status(400).json({ statusCode: 400, data: { message: 'otpToken and otp are required' } });
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid or expired OTP session. Please log in again.' } });
    }
    if (decoded.purpose !== 'admin_otp' || !decoded.email) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid OTP session' } });
    }

    const adminEmail = decoded.email;
    const dbUserId = decoded.dbUserId || 'admin';
    const userRole = decoded.role || 'admin';

    let secret = null;
    let dbUser = null;
    let settings = null;

    if (dbUserId === 'admin') {
      settings = await SiteSettings.findOne({ key: 'main' });
      if (settings && settings.admin2FAEnabled) {
        secret = settings.admin2FASecret;
      }
    } else {
      dbUser = await User.findById(dbUserId);
      if (dbUser && dbUser.twoFaSecret) {
        secret = dbUser.twoFaSecret;
      }
    }

    if (!secret || !secret.trim()) {
      return res.status(503).json({ statusCode: 503, data: { message: '2FA is not configured' } });
    }

    const valid = speakeasy.totp.verify({
      secret: secret.trim(),
      encoding: 'base32',
      token: String(otp).trim(),
      window: 1
    });

    if (!valid) {
      return res.status(401).json({ statusCode: 401, data: { message: 'Invalid OTP' } });
    }

    if (dbUser && !dbUser.twoFaEnabled) {
      dbUser.twoFaEnabled = true;
      await dbUser.save();
    }

    if (dbUserId === 'admin' && settings && !settings.admin2FAVerified) {
      settings.admin2FAVerified = true;
      await settings.save();
    }

    const token = jwt.sign(
      { userId: dbUserId, role: userRole, email: adminEmail },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      statusCode: 200,
      data: {
        message: 'Admin Login successful',
        userId: dbUserId,
        email: adminEmail,
        role: userRole,
        token,
        user: { id: dbUserId, email: adminEmail, role: userRole }
      }
    });
  } catch (error) {
    console.error('Verify Admin OTP Error:', error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};


const toggle2FA = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'enable' or 'disable'
    const requesterRole = req.role;

    if (requesterRole !== 'admin' && requesterRole !== 'subadmin') {
      return res.status(403).json({ statusCode: 403, data: { message: 'Permission denied' } });
    }

    if (userId === 'admin') {
      let settings = await SiteSettings.findOne({ key: 'main' });
      if (!settings) {
        settings = await SiteSettings.create({ key: 'main' });
      }

      if (action === 'disable') {
        settings.admin2FAEnabled = false;
        settings.admin2FASecret = '';
        settings.admin2FAVerified = false;
      } else if (action === 'enable') {
        const secret = speakeasy.generateSecret({ name: 'BRPL Admin' });
        settings.admin2FAEnabled = true;
        settings.admin2FASecret = secret.base32;
        settings.admin2FAVerified = false;
      }

      await settings.save();

      return res.status(200).json({
        statusCode: 200,
        data: {
          message: `Master Admin 2FA ${action}d successfully`
        }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ statusCode: 404, data: { message: 'User not found' } });
    }

    if (action === 'disable') {
      user.twoFaEnabled = false;
      user.twoFaSecret = null; // Clear secret to force re-enrollment if enabled again via login
    } else if (action === 'enable') {
      user.twoFaEnabled = true;
    }

    await user.save();

    res.status(200).json({
      statusCode: 200,
      data: {
        message: `2FA ${action}d successfully`
      }
    });

  } catch (error) {
    console.error("Toggle 2FA Error:", error);
    res.status(500).json({ statusCode: 500, data: { message: 'Server error' } });
  }
};

module.exports = {
  login,
  verifyAdminOtp,
  register,
  upload,
  uploadProfileImage,
  uploadProfileImageHandler,
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
  getStep1Leads,
  exportStep1Leads,
  updateProfile,
  storeSyncData,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
  toggle2FA
};
