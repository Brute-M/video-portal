const Razorpay = require('razorpay');
const crypto = require('crypto');
const Video = require('../model/video.model');
const User = require('../model/user.model');
const Payment = require('../model/payment.model');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RsBsR05m5SGbtT',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '1pFXfyat0LN1xPEeadrz1RN4',
});

// ACTUAL AMOUNT (INR)
const TEST_AMOUNT_INR = 1499;

// Create an order
exports.createOrder = async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: TEST_AMOUNT_INR * 100, // amount in smallest currency unit
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
            amount: TEST_AMOUNT_INR * 100, // amount in smallest currency unit
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
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1pFXfyat0LN1xPEeadrz1RN4')
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
                    video.amount = TEST_AMOUNT_INR;
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

// module level imports handled at top

// ... existing code ...

// Verify landing page payment
exports.verifyLandingPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1pFXfyat0LN1xPEeadrz1RN4')
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        try {
            if (userId) {
                const paidAmount = amount != null ? Number(amount) : TEST_AMOUNT_INR;
                // Update User: isPaid, paymentAmount, and paymentId so admin/DB show correct data
                await User.findByIdAndUpdate(userId, {
                    isPaid: true,
                    paymentAmount: paidAmount,
                    paymentId: razorpay_payment_id,
                    isFromLandingPage: true
                });

                // Create Payment record
                await Payment.create({
                    userId,
                    transactionId: razorpay_payment_id,
                    amount: paidAmount,
                    type: 'registration',
                    status: 'completed',
                    paymentGateway: 'razorpay'
                });

                // Update any pending videos to completed since user is now paid
                await Video.updateMany(
                    { userId: userId, status: 'pending_payment' },
                    { status: 'completed' }
                );
            }
            res.json({ message: "Payment verified successfully", success: true });
        } catch (error) {
            console.error("Error updating status after payment:", error);
            res.status(500).json({ message: "Payment verified but failed to update status", success: false });
        }
    } else {
        res.status(400).json({ message: "Invalid signature", success: false });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const order = await razorpay.orders.fetch(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found", success: false });
        }

        res.json({ message: "Order details fetched successfully", success: true, data: order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send(error);
    }
};