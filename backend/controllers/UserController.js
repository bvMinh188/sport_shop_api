const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { mongooseToObject } = require('../util/mongoose');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';
const SALT_ROUNDS = 10;

class UserController {
    constructor() {
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.addAddress = this.addAddress.bind(this);
        this.updateAddress = this.updateAddress.bind(this);
        this.deleteAddress = this.deleteAddress.bind(this);
        this.setDefaultAddress = this.setDefaultAddress.bind(this);
        this.getAllUsers = this.getAllUsers.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    // [POST] /api/auth/register
    async register(req, res, next) {
        try {
            const { username, email, password, phone } = req.body;

            // Validate required fields
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, email and password are required'
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or username already exists'
                });
            }

            // Create new user
            const user = new User({
                username,
                email,
                password,
                phone
            });

            await user.save();

            // Generate token
            const token = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        isAdmin: user.isAdmin
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/auth/login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate token
            const token = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        isAdmin: user.isAdmin
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/users/profile
    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user.id).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/users/profile
    async updateProfile(req, res, next) {
        try {
            const { username, email, phone } = req.body;
            const updateData = {};

            if (username) {
                const existingUser = await User.findOne({
                    username,
                    _id: { $ne: req.user.id }
                });
                if (existingUser) {
                return res.status(400).json({
                    success: false,
                        message: 'Username already taken'
                });
            }
                updateData.username = username;
            }

            if (email) {
                const existingUser = await User.findOne({
                    email,
                    _id: { $ne: req.user.id }
                });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already taken'
                    });
                }
                updateData.email = email;
            }

            if (phone) updateData.phone = phone;

            const user = await User.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/users/password
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            const user = await User.findById(req.user.id);
            
            // Check current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/users/forgot-password
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            await user.save();

            // Send reset email
            const transporter = nodemailer.createTransport({
                // Configure your email service here
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

            await transporter.sendMail({
                to: user.email,
                subject: 'Password Reset Request',
                html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
            });

            res.json({
                success: true,
                message: 'Password reset email sent'
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/users/reset-password
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }

            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

            // Update user
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/users/addresses
    async addAddress(req, res, next) {
        try {
            const { address, isDefault } = req.body;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    message: 'Address is required'
                });
            }

            const user = await User.findById(req.user.id);

            // If this is the first address or isDefault is true, set as default
            if (isDefault || user.addresses.length === 0) {
                user.addresses.forEach(addr => addr.isDefault = false);
            }

            user.addresses.push({
                address,
                isDefault: isDefault || user.addresses.length === 0
            });

            await user.save();

            res.status(201).json({
                success: true,
                message: 'Address added successfully',
                data: { addresses: user.addresses }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/users/addresses/:id
    async updateAddress(req, res, next) {
        try {
            const { address, isDefault } = req.body;
            const addressId = req.params.id;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    message: 'Address is required'
                });
            }

            const user = await User.findById(req.user.id);
            const addressToUpdate = user.addresses.id(addressId);

            if (!addressToUpdate) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }

            addressToUpdate.address = address;

            if (isDefault) {
                user.addresses.forEach(addr => {
                    addr.isDefault = addr._id.toString() === addressId;
                });
            }

            await user.save();

            res.json({
                success: true,
                message: 'Address updated successfully',
                data: { addresses: user.addresses }
            });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /api/users/addresses/:id
    async deleteAddress(req, res, next) {
        try {
            const addressId = req.params.id;
            const user = await User.findById(req.user.id);
            const addressToDelete = user.addresses.id(addressId);

            if (!addressToDelete) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }

            // If deleting default address, set another as default if exists
            if (addressToDelete.isDefault && user.addresses.length > 1) {
                const newDefault = user.addresses.find(addr => addr._id.toString() !== addressId);
                if (newDefault) {
                    newDefault.isDefault = true;
                }
            }

            addressToDelete.remove();
            await user.save();

            res.json({
                success: true,
                message: 'Address deleted successfully',
                data: { addresses: user.addresses }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/users/addresses/:id/default
    async setDefaultAddress(req, res, next) {
        try {
            const addressId = req.params.id;
            const user = await User.findById(req.user.id);
            const addressToSetDefault = user.addresses.id(addressId);

            if (!addressToSetDefault) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }

            user.addresses.forEach(addr => {
                addr.isDefault = addr._id.toString() === addressId;
            });

            await user.save();

            res.json({
                success: true,
                message: 'Default address updated successfully',
                data: { addresses: user.addresses }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/admin/users
    async getAllUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const role = req.query.role;

            const query = {};
            if (search) {
                query.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            if (role) {
                query.role = role;
            }

            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                User.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalUsers: total
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/admin/users/:id
    async getUserById(req, res, next) {
        try {
            const user = await User.findById(req.params.id)
                .select('-password')
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/admin/users/:id
    async updateUser(req, res, next) {
        try {
            const { username, email, phone, role } = req.body;
            const userId = req.params.id;

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
            });
            }

            // Prevent changing own role
            if (role && userId === req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot change your own role'
                });
    }

            // Check email uniqueness
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ 
                    email, 
                    _id: { $ne: userId } 
                });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
            }

            // Update user
            const updateData = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (phone) updateData.phone = phone;
            if (role) updateData.role = role;

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'User updated successfully',
                data: { user: updatedUser }
            });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /api/admin/users/:id
    async deleteUser(req, res, next) {
        try {
            const userId = req.params.id;
            
            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent self-deletion
            if (userId === req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            // Check if user is admin
            if (user.role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete admin accounts'
                });
            }

            // Check for existing orders
            const existingOrders = await Order.findOne({ userId });
            if (existingOrders) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete user with existing orders'
                });
            }

            await user.remove();
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController(); 