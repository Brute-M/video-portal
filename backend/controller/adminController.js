const User = require('../model/user.model');
const Coach = require('../model/coach.model');
const Influencer = require('../model/influencer.model');
 const jwt = require('jsonwebtoken');

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

        const total = await Model.countDocuments(filter);
        const pages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, pages);
        const skip = (safePage - 1) * limit;

        const items = await Model.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

        const [totalUsers, totalCoaches, totalInfluencers] = await Promise.all([
            User.countDocuments({ isFromLandingPage: true }),
            Coach.countDocuments(),
            Influencer.countDocuments()
        ]);

        return res.json({
            statusCode: 200,
            data: {
                stats: {
                    totalUsers,
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

module.exports = {
    adminLandingLogin,
    getAllRecords,
    getPaginatedRecords,
    getAdminStats
};
