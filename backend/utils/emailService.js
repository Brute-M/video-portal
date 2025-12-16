const nodemailer = require('nodemailer');
const path = require('path');

// Configure your SMTP transporter
// ideally this should be from process.env
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your SMTP host
    auth: {
        user: 'ektadev531@gmail.com', // Replace with environment variable
        pass: 'iaaw zdey hzgw bqen' // Replace with environment variable
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
                    <p style="margin: 5px 0;"><strong>Amount Paid:</strong> Rs. 1.0</p>
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

module.exports = { sendInvoiceEmail };
