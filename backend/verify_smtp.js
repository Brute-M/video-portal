require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing SMTP Connection...');
console.log('Host:', process.env.SMTP_HOST);
console.log('User:', process.env.SMTP_USER);
console.log('Pass Length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : '0');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log('Connection error:', error);
    } else {
        console.log('Server is ready to take our messages');
    }
});
