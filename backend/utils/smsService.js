const axios = require('axios');

const sendSmsOtp = async (mobile, otp) => {
    try {
        // Ensure mobile number has country code if not present, but API might expect 12 digits
        // User example: 918860342926 -> 91 prefix
        let formattedMobile = mobile;
        if (!mobile.startsWith('91') && mobile.length === 10) {
            formattedMobile = '91' + mobile;
        }

        const apiKey = '7GPsKqcKEkuopwryxfsy5A';
        const senderId = 'SMSHUB'; // as per user example
        const gwid = '2';

        // Message template: Welcome to the 2222 powered by SMSINDIAHUB. Your OTP for registration is 3333
        // Replacing 2222 with App Name and 3333 with OTP
        const message = `Welcome to the Beyond Reach Premiere League powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;
        const encodedMessage = encodeURIComponent(message);

        const url = `https://cloud.smsindiahub.in/vendorsms/pushsms.aspx?APIKey=${apiKey}&msisdn=${formattedMobile}&sid=${senderId}&msg=${encodedMessage}&fl=0&dc=0&gwid=${gwid}`;

        const response = await axios.get(url);

        console.log(`SMS OTP sent to ${formattedMobile}:`, response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending SMS OTP:', error);
        // We don't throw here to avoid crashing the flow, but we log it.
        // If strict, we could throw.
    }
};

module.exports = { sendSmsOtp };
