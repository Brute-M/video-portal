const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../model/user.model');
const Video = require('../model/video.model');
const { createInvoiceBuffer } = require('../utils/pdfGenerator');
const { sendRegistrationInvoiceEmail, sendBulkRegistrationEmail } = require('../utils/emailService');

const sendEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to DB');

        const email = 'harekrushnam6@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found!');
            process.exit(1);
        }

        console.log('User found:', user.fname, user.lname);

        const video = await Video.findOne({ userId: user._id }).sort({ createdAt: -1 });

        let pdfBuffer;
        if (video) {
            console.log('Found video for user, generating invoice for video upload...', video.paymentId);
            pdfBuffer = await createInvoiceBuffer(video, user);
        } else {
            console.log('No video found, generating default registration invoice...');
            const dummyVideo = { paymentId: user.paymentId || 'REG-MANUAL-01', amount: 1499, originalName: 'BRPL Registration' };
            pdfBuffer = await createInvoiceBuffer(dummyVideo, user);
        }

        console.log('Sending email...');

        await sendRegistrationInvoiceEmail(user, video ? video.paymentId : (user.paymentId || 'REG-MANUAL-01'), video ? (video.amount || 1499) : 1499, pdfBuffer);

        console.log('Email sent successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

sendEmail();
