const User = require('../model/user.model');
const Otp = require('../model/otp.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');

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
      address1, address2, aadhar, playerRole
    } = req.body;

    if (!email || !password || !fname || !lname || !mobile) {
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

    const newUser = new User({
      fname, lname, email, password: hashedPassword,
      mobile, otp, gender, zone_id, city, state, pincode,
      address1, address2, aadhar,
      trail_video: trail_video_path
    });

    await newUser.save();

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
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
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

    res.status(200).json({ message: "OTP verified successfully", success: true });
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

module.exports = {
  login,
  register,
  upload,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword
};
