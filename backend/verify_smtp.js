require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing SMTP Connection...');
console.log('User:', process.env.EMAIL_USER);
console.log('Pass Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : '0');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log('Connection error:', error);
    } else {
        console.log('Server is ready to take our messages');
    }
});
