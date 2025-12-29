const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  mobile: { type: String, required: true },
  otp: { type: String }, // Storing OTP for verification logic if needed, or just as a field as requested
  gender: { type: String },
  zone_id: { type: String }, // Assuming string ID
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String },
  address1: { type: String },
  address2: { type: String },
  aadhar: { type: String, required: false },
  trail_video: { type: String }, // Path to the uploaded trail video file
  playerRole: { type: String },
  isPaid: { type: Boolean, default: false },
  paymentAmount: { type: Number },
  paymentId: { type: String },
  isFromLandingPage: { type: Boolean, default: false },
  referralCodeUsed: { type: String },
  referralSourceRole: { type: String, enum: ['coach', 'influencer'] },
  referralSourceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referralSourceRole' },
<<<<<<< HEAD
  couponCodeUsed: { type: String },
  couponBenefits: {
    type: [
      {
        name: { type: String, required: true },
        description: { type: String }
      }
    ],
    default: []
  },
=======
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
  // Tracking Fields
  ipAddress: { type: String },
  userAgent: { type: String },
  fbclid: { type: String },
  trackingId: { type: String },
  conversionType: { type: String, enum: ['code', 'fallback', 'organic', 'none'], default: 'none' }
}, { timestamps: true });


const User = mongoose.model('User', userSchema);

module.exports = User;
