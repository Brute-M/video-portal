const User = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const { sendBulkRegistrationEmail } = require('../utils/emailService');
const { createInvoiceBuffer } = require('../utils/pdfGenerator');
const Video = require('../model/video.model');

/**
 * Controller to get all users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getUsers = async (req, res) => {
  const { type } = req.query; // 'paid' or 'unpaid'
  try {
    const users = await User.aggregate([
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
          hasPaidVideo: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$userVideos',
                    as: 'video',
                    cond: { $eq: ['$$video.status', 'completed'] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          isUserPaid: { $or: ['$isPaid', '$hasPaidVideo'] },
          fullName: { $concat: ['$fname', ' ', '$lname'] }
        }
      },
      {
        $match: {
          ...(req.query.type === 'paid' && { isUserPaid: true }),
          ...(req.query.type === 'unpaid' && { isUserPaid: false }),
          ...(req.query.type === 'landing' && { isFromLandingPage: true }),
          // If type is not provided, show all users (for recent registrations)
          ...(req.query.search && {
            $or: [
              { fname: { $regex: req.query.search, $options: 'i' } },
              { lname: { $regex: req.query.search, $options: 'i' } },
              { fullName: { $regex: req.query.search, $options: 'i' } },
              { email: { $regex: req.query.search, $options: 'i' } }
            ]
          }),
          ...(req.query.startDate && req.query.endDate && {
            createdAt: {
              $gte: new Date(req.query.startDate),
              $lte: new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999))
            }
          })
        }
      },
      {
        $project: {
          _id: 1,
          fname: 1,
          lname: 1,
          email: 1,
          mobile: 1,
          state: 1,
          zone_id: 1,
          profileImage: 1,
          playerRole: 1,
          isPaid: '$isUserPaid',
          isFromLandingPage: 1, // Added field
          createdAt: 1,
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
      },
      {
        $addFields: {
          transactionId: '$lastPaymentId' // Alias for clarity
        }
      },
      {
        $match: {
          // specific amount filter if provided
          ...(req.query.amount && { paymentAmount: parseInt(req.query.amount) })
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [
            { $count: "total" }
          ],
          data: [
            { $skip: (parseInt(req.query.page || 1) - 1) * parseInt(req.query.limit || 10) },
            { $limit: parseInt(req.query.limit || 10) }
          ]
        }
      }
    ]);

    const data = users[0].data || [];
    const total = users[0].metadata[0] ? users[0].metadata[0].total : 0;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);

    res.json({
      items: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const createUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: newUser._id,
      email: newUser.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const mongoose = require('mongoose');
    const { getPresignedUrl } = require('../utils/s3Client'); // Import utility

    const users = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) }
      },
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
          hasPaidVideo: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$userVideos',
                    as: 'video',
                    cond: { $eq: ['$$video.status', 'completed'] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          isUserPaid: { $or: ['$isPaid', '$hasPaidVideo'] },
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
          isPaid: '$isUserPaid',
          createdAt: 1,
          paymentId: 1,
          trail_video: 1, // Include trail_video from user document
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

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = users[0];

    if (userData.videos && userData.videos.length > 0) {
      await Promise.all(userData.videos.map(async (video) => {
        const key = video.filename || (video.path ? video.path.split('/').pop() : '');
        if (key) {
          const signedUrl = await getPresignedUrl(key);
          if (signedUrl) {
            video.path = signedUrl;
            video.url = signedUrl;
          }
        }
      }));
    }

    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


const updateUserById = async (req, res) => {
  const userId = req.params.id;
  const { email, password } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) user.email = email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const deleteUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportUsers = async (req, res) => {
  const { type, search, startDate, endDate, source } = req.query; // type: 'paid', 'unpaid', 'landing'; source: 'website' | 'landing' | all
  const sourceFilter = (source || '').toString().trim().toLowerCase();

  try {
    const pipeline = [
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
          hasPaidVideo: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$userVideos',
                    as: 'video',
                    cond: { $eq: ['$$video.status', 'completed'] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          isUserPaid: { $or: ['$isPaid', '$hasPaidVideo'] },
          fullName: { $concat: ['$fname', ' ', '$lname'] }
        }
      },
      {
        $match: {
          ...(type === 'paid' && { isUserPaid: true }),
          ...(type === 'unpaid' && { isUserPaid: false }),
          // If type is 'landing', filter by isFromLandingPage
          ...(type === 'landing' && { isFromLandingPage: true }),
          // Apply source filter so export matches admin list: Website vs Landing Page
          ...(sourceFilter === 'landing' && { isFromLandingPage: true }),
          ...(sourceFilter === 'website' && { isFromLandingPage: { $ne: true } }),

          ...(search && {
            $or: [
              { fname: { $regex: search, $options: 'i' } },
              { lname: { $regex: search, $options: 'i' } },
              { fullName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ]
          }),
          ...(startDate && endDate && {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            }
          })
        }
      },
      {
        $project: {
          fname: 1,
          lname: 1,
          email: 1,
          mobile: 1,
          playerRole: 1,
          isUserPaid: 1,
          isFromLandingPage: 1,
          createdAt: 1,
          // Address fields
          address1: 1,
          address2: 1,
          city: 1,
          state: 1,
          pincode: 1,

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
      },
      { $sort: { createdAt: -1 } }
    ];

    const users = await User.aggregate(pipeline);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Address Line 1', key: 'address1', width: 30 },
      { header: 'Address Line 2', key: 'address2', width: 30 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Pincode', key: 'pincode', width: 10 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Amount Paid', key: 'amount', width: 15 },
      { header: 'Transaction ID', key: 'paymentId', width: 25 },
      { header: 'Registration Date', key: 'date', width: 25 }
    ];

    users.forEach(user => {
      worksheet.addRow({
        name: `${user.fname || ''} ${user.lname || ''}`.trim(),
        email: user.email,
        mobile: user.mobile || 'N/A',
        address1: user.address1 || '',
        address2: user.address2 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        role: user.playerRole || 'N/A',
        status: user.isUserPaid ? 'Paid' : 'Unpaid',
        source: user.isFromLandingPage ? 'Landing Page' : 'Website',
        amount: user.paymentAmount || 0,
        paymentId: user.lastPaymentId,
        date: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
};



const sendBulkRegistrationEmails = async (req, res) => {
  try {
    const paidUsers = await User.find({ isPaid: true });

    let successCount = 0;
    let failCount = 0;

    for (const user of paidUsers) {
      try {
        const videoUser = await Video.findOne({ userId: user._id, status: 'completed' }).sort({ createdAt: -1 });

        let pdfBuffer = null;
        let videoIdForFilename = 'BRPL';

        if (videoUser) {
          pdfBuffer = await createInvoiceBuffer(videoUser, user);
          videoIdForFilename = videoUser.paymentId || videoUser._id.toString();
        }

        await sendBulkRegistrationEmail(user.email, user.fname || 'Participant', pdfBuffer, videoIdForFilename);
        successCount++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
        failCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk email process completed. Successful: ${successCount}, Failed: ${failCount}`
    });
  } catch (error) {
    console.error('Error in sendBulkRegistrationEmails:', error);
    res.status(500).json({ success: false, message: 'Server error processing bulk emails' });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUserById,
  deleteUserById,
  exportUsers,
  sendBulkRegistrationEmails
};