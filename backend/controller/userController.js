const User = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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
          isUserPaid: type === 'paid',
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
          fname: 1,
          lname: 1,
          email: 1,
          mobile: 1,
          playerRole: 1,
          isPaid: '$isUserPaid',
          createdAt: 1,
          videoCount: { $size: '$userVideos' },
          lastPaymentId: {
            $ifNull: [
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
    ]);

    res.json(users);
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
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
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

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUserById,
  deleteUserById
};