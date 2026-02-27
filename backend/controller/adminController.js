const User = require('../model/user.model');
const Coach = require('../model/coach.model');
const Influencer = require('../model/influencer.model');
const Video = require('../model/video.model');
const Payment = require('../model/payment.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { drawInvoice } = require('../utils/pdfGenerator');
const PDFDocument = require('pdfkit');
const SiteSettings = require('../model/siteSettings.model');

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

        if (inputEmail !== adminEmail) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let settings = await SiteSettings.findOne({ key: 'main' });
        if (!settings) settings = await SiteSettings.create({ key: 'main' });

        let isAdminPasswordMatch = false;
        // Check if custom hashed password exists
        if (settings.adminPasswordHash) {
            isAdminPasswordMatch = await bcrypt.compare(password, settings.adminPasswordHash);
        } else {
            // Fallback to env passwords only if no custom hash exists
            isAdminPasswordMatch = (password === adminPassword || password === legacyPassword);
        }

        if (!isAdminPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const twoFaSecret = settings.admin2FASecret;
        if (settings.admin2FAEnabled && twoFaSecret && twoFaSecret.trim()) {
            const otpToken = jwt.sign(
                { purpose: 'admin_otp', email: adminEmail },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.json({
                statusCode: 200,
                data: {
                    requireOtp: true,
                    message: 'OTP Required',
                    otpToken
                }
            });
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const type = (req.query.type || 'users').toString().trim().toLowerCase();
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
        const search = (req.query.search || '').toString().trim();
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const source = (req.query.source || '').toString().trim().toLowerCase();

        const Model = type === 'coaches' ? Coach : type === 'influencers' ? Influencer : User;

        const filter = {};

        // Apply isFromLandingPage for all user-related types based on source filter
        if (['users', 'paid', 'unpaid'].includes(type)) {
            if (source === 'landing') {
                filter.isFromLandingPage = true;
            } else if (source === 'website') {
                filter.isFromLandingPage = { $ne: true };
            }
            // If source is 'all' or empty, no filter is applied for isFromLandingPage
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
        // Apply type-specific filters for User model
        if (type === 'paid') {
            filter.isPaid = true;
        } else if (type === 'unpaid') {
            filter.isPaid = false;
            filter.$or = [
                { paymentAmount: 0 },
                { paymentAmount: { $exists: false } },
                { paymentAmount: null }
            ];
        } else if (type === 'seo_content') {
            filter.role = 'seo_content';
        } else if (type === 'system') {
            filter.role = { $in: ['subadmin', 'seo_content'] };
        }

        if (['users', 'paid', 'unpaid'].includes(type)) {
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
                        profileImage: 1,
                        city: 1, // Also adding city as BRPLShareCard uses it
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

            if (type === 'system' && page === 1 && !search) {
                let settings = await SiteSettings.findOne({ key: 'main' });
                if (!settings) settings = await SiteSettings.create({ key: 'main' });
                const masterAdmin = {
                    _id: 'admin',
                    email: process.env.ADMIN_EMAIL || 'admin@brpl.com',
                    role: 'admin',
                    twoFaEnabled: settings.admin2FAEnabled,
                    createdAt: settings.createdAt || new Date()
                };
                items.unshift(masterAdmin);
            }
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
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
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
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

const getUnpaidUsers = async (req, res) => {
    try {
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
        const search = (req.query.search || '').toString().trim();
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const source = (req.query.source || '').toString().trim().toLowerCase();

        // Base requirements: Unpaid
        const baseFilter = {
            isPaid: false
        };

        if (source === 'landing') {
            baseFilter.isFromLandingPage = true;
        } else if (source === 'website') {
            baseFilter.isFromLandingPage = { $ne: true };
        }

        // Payment check: 0 or null/undefined
        const paymentOr = [
            { paymentAmount: 0 },
            { paymentAmount: { $exists: false } },
            { paymentAmount: null }
        ];

        // Search check
        const searchOr = [];
        if (search) {
            const regex = { $regex: search, $options: 'i' };
            searchOr.push({ email: regex });
            searchOr.push({ mobile: regex });
            searchOr.push({ name: regex });
            searchOr.push({ fname: regex });
            searchOr.push({ lname: regex });
        }

        // Date check
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        // Combine all filters
        const finalFilter = {
            ...baseFilter,
            ...dateFilter,
            $and: [
                { $or: paymentOr }
            ]
        };

        if (searchOr.length > 0) {
            finalFilter.$and.push({ $or: searchOr });
        }

        const total = await User.countDocuments(finalFilter);
        const items = await User.find(finalFilter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.json({
            statusCode: 200,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching unpaid users:', error);
        return res.status(500).json({ message: 'Server error fetching unpaid users' });
    }
};

const createUser = async (req, res) => {
    try {
        // Updated permissions: admin OR subadmin (user creation page handles role restriction for subadmin)
        if (!['admin', 'subadmin'].includes(req.role) && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const {
            fname, lname, email, mobile, city, state, playerRole,
            password, isPaid, paymentAmount, paymentId,
            isFromLandingPage
        } = req.body;

        if (!email || !mobile || !fname) {
            return res.status(400).json({ message: 'Name, Email and Mobile are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { mobile }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or mobile already exists' });
        }

        const hashedPassword = await bcrypt.hash(password || 'Brpl@123', 10);

        const newUser = new User({
            fname,
            lname,
            email: email.toLowerCase(),
            mobile,
            city,
            state,
            playerRole,
            password: hashedPassword,
            isPaid: Boolean(isPaid),
            paymentAmount: isPaid ? Number(paymentAmount) : 0,
            paymentId: isPaid ? paymentId : undefined,
            isFromLandingPage: Boolean(isFromLandingPage),
            conversionType: 'manual_admin'
        });

        const savedUser = await newUser.save();

        // Create Payment Record if paid
        if (isPaid && paymentId) {
            const newPayment = new Payment({
                userId: savedUser._id,
                transactionId: paymentId,
                amount: Number(paymentAmount),
                type: 'registration',
                status: 'completed',
                paymentGateway: 'manual_admin'
            });
            await newPayment.save();
        }

        res.status(201).json({
            statusCode: 201,
            message: 'User created successfully',
            data: savedUser
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error creating user', error: error.message });
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
    manualUserPaymentUpdate,
    getUnpaidUsers,
    createUser
};

