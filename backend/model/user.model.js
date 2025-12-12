const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
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
  gender: { type: String, required: true },
  zone_id: { type: String, required: true }, // Assuming string ID
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  address1: { type: String, required: true },
  address2: { type: String },
  aadhar: { type: String, required: true },
  trail_video: { type: String }, // Path to the uploaded trail video file
  playerRole: { type: String },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });


const User = mongoose.model('User', userSchema);

module.exports = User;
