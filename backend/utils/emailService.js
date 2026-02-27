const nodemailer = require('nodemailer');
const path = require('path');


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
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
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
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

/** Send registration invoice PDF to user email (website/landing registration payment). */
const sendRegistrationInvoiceEmail = async (user, paymentId, amount, pdfBuffer) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
        const attachments = [
            { filename: 'logo.png', path: logoPath, cid: 'logo' }
        ];
        if (pdfBuffer) {
            attachments.push({
                filename: `invoice-${paymentId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        }
        const mailOptions = {
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: `Your BRPL Registration Invoice - ${paymentId}`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                    <p style="font-size: 12px; color: #777;">Ground Floor, Suite G-01, Procapitus Business Park, Noida</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <p>Dear ${user.fname || 'User'},</p>
                <p>Thank you for completing your registration payment. Your registration with BRPL is confirmed.</p>
                <p>Please find attached your invoice for this transaction.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${paymentId}</p>
                    <p style="margin: 5px 0;"><strong>Amount Paid:</strong> Rs. ${amount != null ? amount : 1499}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p style="font-size: 12px; color: #777;">Keep this invoice for your records.</p>
            </div>
            `,
            attachments
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Registration invoice email sent to %s: %s', user.email, info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending registration invoice email:', error);
    }
};

const sendPasswordResetEmail = async (email, otp, name) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');

        const mailOptions = {
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
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
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
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
            from: process.env.SMTP_USER,
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
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
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

const sendUserRegistrationSuccessEmail = async (email, name, password) => {
    try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');

        const mailOptions = {
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Welcome to BRPL - Registration Successful!',
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <p>Hello ${name},</p>
                <p>Thank you for registering with Beyond Reach Premiere League (BRPL)! We are thrilled to have you join our community.</p>
                
                <p>Your account has been created successfully. Here are your login credentials:</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #eee;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                </div>
                
                <p>You can now log in to your dashboard to complete your profile and explore our features.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://brpl.net/auth" style="background-color: #263574; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login to Your Account</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #555;">
                    If you have any questions or need assistance, feel free to reply to this email or contact our support team.
                </p>
                
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                    &copy; ${new Date().getFullYear()} Beyond Reach Premiere League. All rights reserved.
                </p>
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
        console.log('Registration success email sent to %s: %s', email, info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending registration success email:', error);
        // Not throwing to avoid blocking the registration response
    }
};

const sendPartnerEmail = async (partnerDetails) => {
    try {
        const { firstName, lastName, email, contactNumber, companyName, partnershipType, message } = partnerDetails;

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.COMPANY_EMAIL || 'info@brpl.net',
            subject: `New Partner Submission from ${firstName} ${lastName}`,
            html: `
                <h3>New Partner Application</h3>
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Company Name:</strong> ${companyName || 'N/A'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contact Number:</strong> ${contactNumber}</p>
                <p><strong>Partnership Type:</strong> ${partnershipType}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Partner email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending partner email:', error);
        // Log error but don't throw to avoid failing the controller request
    }
};

const sendBulkRegistrationEmail = async (email, name, pdfBuffer, videoId) => {
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
                filename: `Invoice-${videoId || 'BRPL'}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        }

        const mailOptions = {
            from: `"Beyond Reach Premiere League" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'BRPL Registration Successful',
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="BRPL Logo" style="width: 80px;" />
                    <h2 style="color: #444; margin-top: 10px;">Beyond Reach Premiere League</h2>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee;" />
                
                <p>Dear ${name},</p>
                
                <p>Congratulations on successfully registering for the BRPL – Beyond Reach Premier League.</p>
                
                <p>We are pleased to inform you that you are now officially enrolled for the BRPL Trials scheduled to take place between June 2026 and July 2026.</p>
                
                <p>Trial cities will be announced soon, stay tuned!</p>
                
                <p>This is an exciting opportunity to demonstrate your skills and take a step closer to becoming part of a premier cricket league designed to nurture emerging talent across India.</p>
                
                <p>To stay informed with real-time updates, announcements, and important trial information, we recommend following our official Social Media pages:</p>
                
                <ul style="list-style-type: none; padding: 0;">
                    <li style="margin-bottom: 8px;"><strong>Insta:</strong> <a href="https://www.instagram.com/brpl.t10?igsh=eTY1aXVnN2tlb2pu" style="color: #008CBA;">@brpl.t10</a></li>
                    <li style="margin-bottom: 8px;"><strong>Twitter:</strong> <a href="https://x.com/BRPLOfficial?t=-4fW1n7vpmumIID4pE0NQA&s=09" style="color: #008CBA;">@brplofficial</a></li>
                    <li style="margin-bottom: 8px;"><strong>Facebook:</strong> <a href="https://www.facebook.com/share/1PdfXsD6d4/?mibextid=wwXIfr" style="color: #008CBA;">@Brplofficial</a></li>
                    <li style="margin-bottom: 8px;"><strong>YouTube:</strong> <a href="https://youtube.com/@beyondreachpremierleague?si=WalwhqVbYOMOW6h0" style="color: #008CBA;">Beyond Reach Premier League</a></li>
                </ul>
                
                <p>We look forward to seeing you at the trials and wish you the very best in your journey with BRPL.</p>
                
                <p>Warm regards,<br>
                Team BRPL<br>
                Beyond Reach Premier League</p>
                
                <p style="font-size: 12px; color: #777; margin-top: 30px; text-align: center;">
                    &copy; ${new Date().getFullYear()} Beyond Reach Premiere League. All rights reserved.
                </p>
            </div>
            `,
            attachments: attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Bulk Registration email sent to %s: %s', email, info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending registration confirmation email to', email, error);
    }
};

module.exports = {
    sendInvoiceEmail,
    sendRegistrationInvoiceEmail,
    sendPasswordResetEmail,
    sendContactEmail,
    sendRegistrationOtpEmail,
    sendWelcomeEmail,
    sendUserRegistrationSuccessEmail,
    sendPartnerEmail,
    sendBulkRegistrationEmail
};

