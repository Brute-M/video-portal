const nodemailer = require('nodemailer');
const path = require('path');

// Configure your SMTP transporter
// ideally this should be from process.env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
    auth: {
        user: process.env.SMTP_USER || 'ektadev531@gmail.com',
        pass: process.env.SMTP_PASS || 'cwxg fuib owkp mkep'
    }
});

const sendInvoiceEmail = async (user, video, downloadLink, previewLink, pdfBuffer) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');

        const attachments = [
            {
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo'
            }
        ];

        if (pdfBuffer) {
            attachments.push({
                filename: `invoice-${video.paymentId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        }

        const mailOptions = {
            from: '"Beyond Reach Premiere League" <ektadev531@gmail.com>',
            to: user.email,
            subject: `Invoice for Transaction ${video.paymentId}`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                    <p style="font-size: 12px; color: #777;">Ground Floor, Suite G-01, Procapitus Business Park, Noida</p>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <p>Dear ${user.fname},</p>
                <p>Thank you for your payment. Your video <strong>"${video.originalName}"</strong> has been successfully uploaded and is now live.</p>
                
                <p>Please find attached the invoice for your transaction.</p>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${video.paymentId}</p>
                    <p style="margin: 5px 0;"><strong>Amount Paid:</strong> Rs. 1499</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${previewLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Invoice Online</a>
                    <a href="${downloadLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Again</a>
                </div>
            </div>
            `,
            attachments: attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // We generally don't want to throw here to avoid failing the main payment flow
        // just log the error
    }
};

const sendPasswordResetEmail = async (email, otp, name) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');

        const mailOptions = {
            from: '"Beyond Reach Premiere League" <ektadev531@gmail.com>',
            to: email,
            subject: 'Password Reset OTP - BRPL',
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <p>Hello ${name || 'User'},</p>
                <p>You requested a password reset. Please use the following OTP to reset your password:</p>
                
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${otp}
                </div>
                
                <p>If you did not request this, please ignore this email.</p>
                
                <p style="font-size: 12px; color: #777; margin-top: 30px;">This OTP will expire in 5 minutes.</p>
            </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Reset OTP sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending reset email:', error);
        throw error;
    }
};

const sendRegistrationOtpEmail = async (email, otp) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');

        const mailOptions = {
            from: '"Beyond Reach Premiere League" <ektadev531@gmail.com>',
            to: email,
            subject: 'Registration OTP - BRPL',
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <p>Hello,</p>
                <p>Verify your email address to complete your registration request. Please use the following OTP:</p>
                
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
                    ${otp}
                </div>
                
                <p>If you did not request this, please ignore this email.</p>
                
                <p style="font-size: 12px; color: #777; margin-top: 30px;">This OTP will expire in 5 minutes.</p>
            </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Registration OTP sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending registration OTP email:', error);
        throw error;
    }
};

const sendContactEmail = async (contactDetails) => {
    try {
        const { firstName, lastName, email, mobileNumber, message } = contactDetails;

        const mailOptions = {
            from: 'ektadev531@gmail.com',
            to: process.env.COMPANY_EMAIL || 'info@brpl.net', // Receiver address (Company)
            subject: `New Contact Inquiry from ${firstName} ${lastName}`,
            html: `
                <h3>New Contact Us Form Submission</h3>
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mobile:</strong> ${mobileNumber}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Contact email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending contact email:', error);
        // We don't throw here to avoid failing the DB save in the controller if email fails
        // but the controller might want to know, so actually let's re-throw or handle there.
        // The original controller code didn't fail the request if email failed.
        // let's just log as consistent with other functions in this file.
    }
};

const sendWelcomeEmail = async (email, name, referralCode, role) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');

        const mailOptions = {
            from: '"Beyond Reach Premiere League" <ektadev531@gmail.com>',
            to: email,
            subject: `Welcome to BRPL - Your ${role === 'coach' ? 'Coach' : 'Influencer'} Account is Ready!`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <p>Hello ${name},</p>
                <p>Welcome to BRPL! We are excited to have you on board as a <strong>${role}</strong>.</p>
                <p>Your registration is complete. Here is your unique referral code:</p>
                
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 2px; font-weight: bold; margin: 20px 0; color: #263574;">
                    ${referralCode}
                </div>
                
                <p>You can share this code with others to join BRPL.</p>
                <p>You can now login to your dashboard using your registered email and password.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://brpl.net/auth/login" style="background-color: #263574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
                </div>
            </div>
            `,
            attachments: [
                {
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${role} ${email}: %s`, info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
};

module.exports = { sendInvoiceEmail, sendPasswordResetEmail, sendContactEmail, sendRegistrationOtpEmail, sendWelcomeEmail };

