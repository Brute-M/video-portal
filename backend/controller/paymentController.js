const Razorpay = require('razorpay');
const crypto = require('crypto');
const Video = require('../model/video.model');
const User = require('../model/user.model');
const Payment = require('../model/payment.model');
const InfluencerLink = require('../model/InfluencerLink.model');
const { createInvoiceBuffer } = require('../utils/pdfGenerator');
const { sendRegistrationInvoiceEmail } = require('../utils/emailService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RsBsR05m5SGbtT',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '1pFXfyat0LN1xPEeadrz1RN4',
});

// ACTUAL AMOUNT (INR)
const TEST_AMOUNT_INR = 1499;
const MOBILE_AMOUNT_INR = 999;
const INFLUENCER_DISCOUNT_INR = 999;

// Pending influencer orders: orderId -> { userId, amount, influencerLinkId }
const pendingInfluencerOrders = new Map();

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

// Create order for mobile app (Rs 999 only)
exports.createOrderMobile = async (req, res) => {
    const { currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: MOBILE_AMOUNT_INR * 100, // 999 INR in paise
            currency,
            receipt: receipt || `mobile_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order for mobile:', error);
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

    if (!isAuthentic) {
        return res.status(400).json({ message: "Invalid signature", success: false });
    }

    if (!userId) {
        console.error("verifyLandingPayment: signature valid but userId missing in request body");
        return res.status(400).json({
            message: "User ID is required to complete payment verification",
            success: false
        });
    }

    try {
        const paidAmount = amount != null ? Number(amount) : TEST_AMOUNT_INR;
        // Update User: isPaid, paymentAmount, and paymentId so admin/DB show correct data
        const updateData = {
            isPaid: true,
            paymentAmount: paidAmount,
            paymentId: razorpay_payment_id
        };

        if (req.body.isFromLandingPage !== undefined) {
            updateData.isFromLandingPage = String(req.body.isFromLandingPage).toLowerCase() === 'true';
        }

        await User.findByIdAndUpdate(userId, updateData);

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

        // Send invoice to user email (website/landing registration)
        try {
            console.log('[Invoice Email] verifyLandingPayment: attempting to send registration invoice, userId=', userId);
            const user = await User.findById(userId).select('-password');
            if (!user) {
                console.warn('[Invoice Email] verifyLandingPayment: user not found for userId=', userId);
            } else if (!user.email) {
                console.warn('[Invoice Email] verifyLandingPayment: user has no email, userId=', userId);
            } else {
                console.log('[Invoice Email] verifyLandingPayment: generating PDF for user', user.email);
                const invoiceData = {
                    paymentId: razorpay_payment_id,
                    amount: paidAmount,
                    originalName: 'Registration / Service Fee',
                    createdAt: new Date()
                };
                const pdfBuffer = await createInvoiceBuffer(invoiceData, user);
                console.log('[Invoice Email] verifyLandingPayment: PDF generated, sending to', user.email);
                await sendRegistrationInvoiceEmail(user, razorpay_payment_id, paidAmount, pdfBuffer);
                console.log('[Invoice Email] verifyLandingPayment: registration invoice email sent successfully to', user.email);
            }
        } catch (emailErr) {
            console.error('[Invoice Email] verifyLandingPayment: failed to send registration invoice email:', emailErr?.message || emailErr);
            if (emailErr?.stack) console.error(emailErr.stack);
            // Do not fail the payment response; user is already paid
        }

        res.json({ message: "Payment verified successfully", success: true });
    } catch (error) {
        console.error("Error updating status after payment:", error);
        res.status(500).json({ message: "Payment verified but failed to update status", success: false });
    }
};

// Verify mobile app payment (Rs 999 only)
exports.verifyMobilePayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1pFXfyat0LN1xPEeadrz1RN4')
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        return res.status(400).json({ message: "Invalid signature", success: false });
    }

    if (!userId) {
        return res.status(400).json({
            message: "User ID is required to complete payment verification",
            success: false
        });
    }

    try {
        const paidAmount = MOBILE_AMOUNT_INR; // Always 999 for mobile
        await User.findByIdAndUpdate(userId, {
            isPaid: true,
            paymentAmount: paidAmount,
            paymentId: razorpay_payment_id
        });

        await Payment.create({
            userId,
            transactionId: razorpay_payment_id,
            amount: paidAmount,
            type: 'registration',
            status: 'completed',
            paymentGateway: 'razorpay'
        });

        await Video.updateMany(
            { userId: userId, status: 'pending_payment' },
            { status: 'completed' }
        );

        try {
            console.log('[Invoice Email] verifyMobilePayment: attempting to send registration invoice, userId=', userId);
            const user = await User.findById(userId).select('-password');
            if (!user) {
                console.warn('[Invoice Email] verifyMobilePayment: user not found for userId=', userId);
            } else if (!user.email) {
                console.warn('[Invoice Email] verifyMobilePayment: user has no email, userId=', userId);
            } else {
                console.log('[Invoice Email] verifyMobilePayment: generating PDF for user', user.email);
                const invoiceData = {
                    paymentId: razorpay_payment_id,
                    amount: paidAmount,
                    originalName: 'Registration / Service Fee (Mobile)',
                    createdAt: new Date()
                };
                const pdfBuffer = await createInvoiceBuffer(invoiceData, user);
                console.log('[Invoice Email] verifyMobilePayment: PDF generated, sending to', user.email);
                await sendRegistrationInvoiceEmail(user, razorpay_payment_id, paidAmount, pdfBuffer);
                console.log('[Invoice Email] verifyMobilePayment: registration invoice email sent successfully to', user.email);
            }
        } catch (emailErr) {
            console.error('[Invoice Email] verifyMobilePayment: failed to send registration invoice email:', emailErr?.message || emailErr);
            if (emailErr?.stack) console.error(emailErr.stack);
        }

        res.json({ message: "Payment verified successfully", success: true });
    } catch (error) {
        console.error("Error updating status after mobile payment:", error);
        res.status(500).json({ message: "Payment verified but failed to update status", success: false });
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

// --- Influencer discount flow (separate from default 1499 flow) ---

exports.createOrderRegistrationInfluencer = async (req, res) => {
    const { userId, influencerSlug: bodySlug } = req.body;
    if (!userId) {
        return res.status(400).json({ message: "userId is required", success: false });
    }
    try {
        const user = await User.findById(userId).select('influencerSlug influencerDiscountApplied isPaid');
        if (!user) return res.status(404).json({ message: "User not found", success: false });
        if (user.isPaid) return res.status(400).json({ message: "User already paid", success: false });
        if (user.influencerDiscountApplied) {
            return res.status(400).json({ message: "Influencer discount already applied for this user", success: false });
        }

        // Use slug from user (saved at registration) or from request (influencer URL flow when user record missed it)
        const slugToUse = user.influencerSlug || (bodySlug ? String(bodySlug).trim().toLowerCase() : null);
        if (!slugToUse) {
            return res.status(400).json({ message: "No influencer attribution; use standard payment", success: false });
        }

        const link = await InfluencerLink.findOne({ slug: slugToUse, status: 'active' });
        if (!link) {
            return res.status(400).json({ message: "Influencer link not found or inactive", success: false });
        }

        const amountInr = link.discountPrice != null ? Number(link.discountPrice) : INFLUENCER_DISCOUNT_INR;
        const amountPaise = Math.round(amountInr * 100);

        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: `inf_${link.slug}_${Date.now()}`
        });

        pendingInfluencerOrders.set(order.id, {
            userId,
            amount: amountInr,
            influencerLinkId: link._id.toString(),
            slug: link.slug
        });
        // Optional: clear old entries by order id after some TTL (e.g. 1 hour)
        setTimeout(() => pendingInfluencerOrders.delete(order.id), 60 * 60 * 1000);

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt
        });
    } catch (error) {
        console.error('Error creating influencer order:', error);
        res.status(500).json({ message: "Failed to create order", success: false });
    }
};

exports.verifyLandingPaymentInfluencer = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '1pFXfyat0LN1xPEeadrz1RN4')
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid signature", success: false });
    }

    const pending = pendingInfluencerOrders.get(razorpay_order_id);
    if (!pending) {
        return res.status(400).json({ message: "Order not found or expired; use standard verify if this was a regular payment", success: false });
    }
    if (pending.userId !== userId) {
        return res.status(400).json({ message: "User mismatch", success: false });
    }

    const paidAmount = pending.amount;
    try {
        await User.findByIdAndUpdate(userId, {
            isPaid: true,
            paymentAmount: paidAmount,
            paymentId: razorpay_payment_id,
            influencerDiscountApplied: true
        });

        await Payment.create({
            userId,
            transactionId: razorpay_payment_id,
            amount: paidAmount,
            type: 'registration',
            status: 'completed',
            paymentGateway: 'razorpay'
        });

        await Video.updateMany(
            { userId, status: 'pending_payment' },
            { status: 'completed' }
        );

        await InfluencerLink.findByIdAndUpdate(pending.influencerLinkId, {
            $inc: { totalPayments: 1, totalRevenue: paidAmount }
        });

        pendingInfluencerOrders.delete(razorpay_order_id);

        const user = await User.findById(userId).select('-password');
        if (user && user.email) {
            try {
                const invoiceData = {
                    paymentId: razorpay_payment_id,
                    amount: paidAmount,
                    originalName: 'Registration / Service Fee (Influencer)',
                    createdAt: new Date()
                };
                const pdfBuffer = await createInvoiceBuffer(invoiceData, user);
                await sendRegistrationInvoiceEmail(user, razorpay_payment_id, paidAmount, pdfBuffer);
            } catch (emailErr) {
                console.error('[Invoice Email] verifyLandingPaymentInfluencer failed:', emailErr?.message || emailErr);
            }
        }

        res.json({ message: "Payment verified successfully", success: true });
    } catch (error) {
        console.error("Error in verifyLandingPaymentInfluencer:", error);
        res.status(500).json({ message: "Payment verified but failed to update status", success: false });
    }
};