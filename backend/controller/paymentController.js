const Razorpay = require('razorpay');
const crypto = require('crypto');
const Video = require('../model/video.model');

const razorpay = new Razorpay({
<<<<<<< HEAD
    key_id: 'rzp_live_RsBsR05m5SGbtT' || process.env.RAZORPAY_KEY_ID,
    key_secret: '1pFXfyat0LN1xPEeadrz1RN4' || process.env.RAZORPAY_KEY_SECRET,
=======
    key_id: 'rzp_live_RsBsR05m5SGbtT',
    key_secret: '1pFXfyat0LN1xPEeadrz1RN4',
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
});

// Create an order
exports.createOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: 1499 * 100, // amount in smallest currency unit (1499 INR)
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).send(error);
    }
};

// Create order for landing page
exports.createOrderLanding = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: 1499 * 100, // amount in smallest currency unit (1499 INR)
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order for landing:', error);
        res.status(500).send(error);
    }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, videoId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', '1pFXfyat0LN1xPEeadrz1RN4')
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        try {
            // Payment is successful, update video status
            if (videoId) {
                const video = await Video.findById(videoId);
                if (video) {
                    video.status = 'completed';
                    video.paymentId = razorpay_payment_id;
                    video.amount = 1499; // Fixed amount
                    await video.save();
                    return res.json({ message: "Payment verified and video updated successfully", success: true });
                }
            }
            res.json({ message: "Payment verified", success: true });

        } catch (error) {
            console.error("Error updating video status:", error);
            res.status(500).json({ message: "Payment verified but failed to update status", success: false });
        }
    } else {
        res.status(400).json({ message: "Invalid signature", success: false });
    }
};

// Verify landing page payment
exports.verifyLandingPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', '1pFXfyat0LN1xPEeadrz1RN4')
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        res.json({ message: "Payment verified successfully", success: true });
    } else {
        res.status(400).json({ message: "Invalid signature", success: false });
    }
};
