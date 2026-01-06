const User = require('../model/user.model');
const Coach = require('../model/coach.model');
const Influencer = require('../model/influencer.model');
const Video = require('../model/video.model');
const Payment = require('../model/payment.model');
const jwt = require('jsonwebtoken');
const { drawInvoice } = require('../utils/pdfGenerator');
const PDFDocument = require('pdfkit');

const adminLandingLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@brpl.com').toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const legacyPassword = 'Admin@123';

        const inputEmail = String(email).toLowerCase().trim();

        if (inputEmail !== adminEmail || (password !== adminPassword && password !== legacyPassword)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: 'admin', role: 'admin', email: adminEmail },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            statusCode: 200,
            data: {
                token,
                user: {
                    id: 'admin',
                    email: adminEmail,
                    role: 'admin'
                }
            }
        });
    } catch (error) {
        console.error('Admin landing login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Fetch all records from all collections
const getAllRecords = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 });
        const coaches = await Coach.find().select('-password').sort({ createdAt: -1 });
        const influencers = await Influencer.find().select('-password').sort({ createdAt: -1 });

        res.json({
            statusCode: 200,
            data: {
                users,
                coaches,
                influencers,
                stats: {
                    totalUsers: users.length,
                    totalCoaches: coaches.length,
                    totalInfluencers: influencers.length
                }
            }
        });
    } catch (error) {
        console.error("Error fetching admin records:", error);
        res.status(500).json({ message: "Server error fetching records" });
    }
};

const getPaginatedRecords = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const type = (req.query.type || 'users').toString();
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
        const search = (req.query.search || '').toString().trim();
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const Model = type === 'coaches' ? Coach : type === 'influencers' ? Influencer : User;

        const filter = {};
        if (type === 'users') {
            filter.isFromLandingPage = true;
        }
        if (search) {
            // eslint-disable-next-line no-useless-escape
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { fname: { $regex: search, $options: 'i' } },
                { lname: { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const total = await Model.countDocuments(filter);
        const pages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, pages);
        const skip = (safePage - 1) * limit;

        let items;
        if (type === 'users') {
            items = await User.aggregate([
                { $match: filter },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'videos',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'userVideos'
                    }
                },
                {
                    $addFields: {
                        fullName: { $concat: ['$fname', ' ', '$lname'] }
                    }
                },
                {
                    $project: {
                        fname: 1,
                        lname: 1,
                        email: 1,
                        mobile: 1,
                        playerRole: 1,
                        isPaid: 1,
                        createdAt: 1,
                        trail_video: 1,
                        isFromLandingPage: 1,
                        videoCount: { $size: '$userVideos' },
                        videos: '$userVideos',
                        paymentAmount: {
                            $add: [
                                { $ifNull: ['$paymentAmount', 0] },
                                {
                                    $sum: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$userVideos',
                                                    as: 'v',
                                                    cond: { $eq: ['$$v.status', 'completed'] }
                                                }
                                            },
                                            as: 'paidVideo',
                                            in: { $ifNull: ['$$paidVideo.amount', 0] }
                                        }
                                    }
                                }
                            ]
                        },
                        lastPaymentId: {
                            $ifNull: [
                                '$paymentId',
                                {
                                    $let: {
                                        vars: {
                                            paidVideos: {
                                                $filter: {
                                                    input: '$userVideos',
                                                    as: 'v',
                                                    cond: { $ne: [{ $ifNull: ['$$v.paymentId', null] }, null] }
                                                }
                                            }
                                        },
                                        in: { $last: '$$paidVideos.paymentId' }
                                    }
                                },
                                'N/A'
                            ]
                        }
                    }
                }
            ]);
        } else {
            items = await Model.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
        }

        return res.json({
            statusCode: 200,
            data: {
                type,
                items,
                pagination: {
                    page: safePage,
                    limit,
                    total,
                    pages
                }
            }
        });
    } catch (error) {
        console.error('Error fetching paginated admin records:', error);
        return res.status(500).json({ message: 'Server error fetching records' });
    }
};

const getAdminStats = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const [paidUsers, unpaidUsers, totalCoaches, totalInfluencers] = await Promise.all([
            User.find({ isPaid: true }),
            User.find({ isPaid: false }),
            Coach.countDocuments(),
            Influencer.countDocuments()
        ]);

        const paidCount = paidUsers.length;
        const unpaidCount = unpaidUsers.length;
        const totalRevenue = paidUsers.reduce((sum, user) => sum + (user.paymentAmount || 0), 0);

        return res.json({
            statusCode: 200,
            data: {
                stats: {
                    totalUsers: paidCount + unpaidCount,
                    paidCount,
                    unpaidCount,
                    totalRevenue,
                    totalCoaches,
                    totalInfluencers
                }
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return res.status(500).json({ message: 'Server error fetching stats' });
    }
};

const getDashboardChartData = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of the month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const chartData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $project: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" },
                    isPaid: 1,
                    paymentAmount: 1
                }
            },
            {
                $group: {
                    _id: { month: "$month", year: "$year" },
                    users: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ["$isPaid", true] }, { $ifNull: ["$paymentAmount", 1] }, 0]
                        }
                    }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Format data for Recharts (fill missing months if needed, or just return as is)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Generate last 6 months list to ensure all months are present
        const result = [];
        const currentCheckDate = new Date(sixMonthsAgo);
        const now = new Date();

        while (currentCheckDate <= now) {
            const m = currentCheckDate.getMonth() + 1;
            const y = currentCheckDate.getFullYear();
            const existing = chartData.find(d => d._id.month === m && d._id.year === y);

            result.push({
                name: monthNames[m - 1],
                users: existing ? existing.users : 0,
                revenue: existing ? existing.revenue : 0
            });

            currentCheckDate.setMonth(currentCheckDate.getMonth() + 1);
        }

        return res.json({
            statusCode: 200,
            data: result
        });

    } catch (error) {
        console.error('Error fetching dashboard chart data:', error);
        return res.status(500).json({ message: 'Server error fetching chart data' });
    }
};

const downloadUserInvoice = async (req, res) => {
    try {
        // Admin check
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { userId } = req.params;
        const { type } = req.query; // 'view' or 'download'

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.isPaid) {
            const paidVideoExists = await Video.findOne({ userId: userId, status: 'completed' });
            if (!paidVideoExists) {
                return res.status(400).json({ message: "User is not paid, no invoice available." });
            }
        }

        const video = await Video.findOne({ userId: userId, status: 'completed' }).sort({ createdAt: -1 });
        let invoiceData = {};

        if (video) {
            invoiceData = video;
        } else {
            // Fallback to user payment info (e.g. if they just paid registration fee without video)
            invoiceData = {
                paymentId: user.paymentId || (user.paymentAmount ? `REC-${userId.substring(0, 8)}` : 'N/A'),
                amount: user.paymentAmount || 0,
                originalName: "Registration / Service Fee",
                createdAt: user.createdAt
            };
        }

        // Ensure we have a paymentId to show
        if (!invoiceData.paymentId && user.paymentId) {
            invoiceData.paymentId = user.paymentId;
        }

        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        if (type === 'view') {
            res.setHeader('Content-Disposition', `inline; filename=invoice-${invoiceData.paymentId || 'user'}.pdf`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceData.paymentId || 'user'}.pdf`);
        }

        doc.pipe(res);
        drawInvoice(doc, invoiceData, user);
        doc.end();

    } catch (error) {
        console.error("Admin Invoice generation error", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Could not generate invoice" });
        }
    }
};

const getPayments = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
        const search = (req.query.search || '').toString().trim();
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(filter)
            .populate('userId', 'fname lname email mobile')
            .populate('videoId', 'originalName filename')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments(filter);

        res.json({
            statusCode: 200,
            data: {
                items: payments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Server error fetching payments" });
    }
};

const manualUserPaymentUpdate = async (req, res) => {
    try {
        if (req.role !== 'admin' && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { userId } = req.params;
        const { paymentId, paymentAmount, isFromLandingPage } = req.body;

        if (!paymentId || !paymentAmount) {
            return res.status(400).json({ message: 'Payment ID and Amount are required' });
        }

        const updateData = {
            isPaid: true,
            paymentId,
            paymentAmount,
        };

        if (isFromLandingPage !== undefined) {
            updateData.isFromLandingPage = isFromLandingPage;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            statusCode: 200,
            message: 'User payment status updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error in manualUserPaymentUpdate:', error);
        res.status(500).json({ message: 'Server error updating user payment' });
    }
};

module.exports = {
    adminLandingLogin,
    getAllRecords,
    getPaginatedRecords,
    getAdminStats,
    getDashboardChartData,
    downloadUserInvoice,
    getPayments,
    manualUserPaymentUpdate
};

