const crypto = require('crypto');

exports.handleRazorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'brplWebhook@2026!Secure';

        // We use req.rawBody provided by our custom express.json() verify function
        const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            console.error('Webhook signature missing');
            return res.status(400).send('Signature missing');
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('Webhook signature verification failed');
            return res.status(400).send('Invalid signature');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`Received Razorpay webhook event: ${event}`);

        // Handle specific webhook events
        switch (event) {
            case 'payment.captured':
            case 'payment.failed':
            case 'refund.processed':
            case 'refund.failed':
            case 'refund.created':
                // Implement further business logic in the future based on event payload
                console.log(`[Webhook Event Processed] ${event}`);
                break;
            default:
                console.log(`[Unhandled Webhook Event] ${event}`);
        }

        // Always return 200 OK according to Razorpay docs
        res.status(200).json({ status: "ok" });
    } catch (error) {
        console.error('Error handling Razorpay webhook:', error);
        res.status(500).send('Server Error');
    }
};
