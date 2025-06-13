const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { mongooseToObject } = require('../util/mongoose');
const dotenv = require('dotenv');
const { sendPasswordResetEmail } = require('../util/mailjet');

dotenv.config();

const SECRET_CODE = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

class UserController {
    constructor() {
        this.signUp = this.signUp.bind(this);
        this.logined = this.logined.bind(this);
        this.handleForgotPassword = this.handleForgotPassword.bind(this);
        this.handleResetPassword = this.handleResetPassword.bind(this);
        this.logout = this.logout.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.changePassword = this.changePassword.bind(this);
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
    async signUp(req, res, next) {
        try {
            const { email, password, username, phone } = req.body;

            // Validate required fields
            if (!email || !password || !username) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, password và username là bắt buộc'
                });
            }

            // Kiểm tra email đã tồn tại
            const userByEmail = await User.findOne({ email });
            if (userByEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được đăng ký'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Tạo user mới
            const user = new User({
                username,
                email,
                password: hashedPassword,
                phone,
                role: 'user',
                addresses: []
            });

            await user.save();

            // Tạo token
            const token = jwt.sign({ id: user._id }, SECRET_CODE, {
                expiresIn: '24h'
            });

            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/auth/login
    async logined(req, res, next) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email và password là bắt buộc'
                });
            }

            // Tìm user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản không tồn tại'
                });
            }

            // Kiểm tra password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Sai mật khẩu'
                });
            }

            // Tạo token
            const token = jwt.sign({ id: user._id }, SECRET_CODE, {
                expiresIn: '24h'
            });

            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
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
            // Kiểm tra user tồn tại
            const existingUser = await User.findById(req.user._id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user: existingUser }
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
            
            // Kiểm tra user tồn tại
            const existingUser = await User.findById(req.user._id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Thêm các trường cần update
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (phone) updateData.phone = phone;

            // Thực hiện update và lưu kết quả
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                updateData,
                { new: true }  // Trả về document sau khi update
            );

            // Kiểm tra kết quả update
            if (!updatedUser) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update profile'
                });
            }

            // Trả về response với user đã update
            return res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user: updatedUser }
            });

        } catch (error) {
            console.error('Update profile error:', error);
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

    // [POST] /api/auth/forgot-password
    async handleForgotPassword(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email là bắt buộc'
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Email không tồn tại trong hệ thống'
                });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
            await user.save();

            // Gửi email đặt lại mật khẩu bằng mailjet
            await sendPasswordResetEmail(email, resetToken);

            res.json({
                success: true,
                message: 'Link đặt lại mật khẩu đã được gửi vào email của bạn',
                data: {
                    resetToken // Trong thực tế không nên trả về token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/auth/reset-password
    async handleResetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Token và password mới là bắt buộc'
                });
            }

            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Token không hợp lệ hoặc đã hết hạn'
                });
            }

            // Hash và cập nhật password mới
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Đặt lại mật khẩu thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/auth/logout
    async logout(req, res) {
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    }

    // [POST] /api/users/addresses
    async addAddress(req, res, next) {
        try {
            const {name, phone, address, isDefault } = req.body;

            // Validate required fields
            if (!phone || !address || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone and address are required'
                });
            }

            // Check if user exists
            const existingUser = await User.findById(req.user._id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Create new address object
            const newAddress = {
                name,
                phone,
                address,
                isDefault: isDefault || existingUser.addresses.length === 0 // Set as default if it's the first address
            };

            // If this is set as default, unset others
            if (newAddress.isDefault) {
                existingUser.addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }

            // Add new address to array
            existingUser.addresses.push(newAddress);

            await existingUser.save();

            res.status(201).json({
                success: true,
                message: 'Address added successfully',
                data: { addresses: existingUser.addresses }
            });
        } catch (error) {
            console.error('Error in addAddress:', error);
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

    // [PUT] /api/users/set-default-address
    async setDefaultAddress(req, res, next) {
        try {
            const { addressId } = req.body;

            // Check if user exists
            const existingUser = await User.findById(req.user._id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Validate addressId
            if (!addressId) {
                return res.status(400).json({
                    success: false,
                    message: 'Address ID is required'
                });
            }

            // Find the address with the given ID
            const address = existingUser.addresses.find(addr => addr._id.toString() === addressId);
            if (!address) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }

            // Set all other addresses to not default
            existingUser.addresses.forEach(addr => {
                addr.isDefault = false;
            });

            // Set the selected address as default
            address.isDefault = true;

            await existingUser.save();

            res.json({ 
                success: true, 
                message: 'Default address updated successfully',
                data: { addresses: existingUser.addresses }
            });
        } catch (error) {
            console.error('Error in setDefaultAddress:', error);
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

    // Get /api/totalusers
    async totalUsers(req, res, next) {
        try {
            const totalUsers = await User.countDocuments();
            res.json({
                success: true,
                data: { totalUsers }
            });
        } catch (err) {
            next(err);
        }
    }
    
    // Get /api/allusers
    async getAllUsers(req, res, next) {
        try {
            const users = await User.find({}).lean();
            res.json({
                success: true,
                data: { users }
            });
        } catch (err) {
            next(err);
        }
    }
    
    // Put /api/users/:id/setadmin
    async setAdmin(req, res, next) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id,{
                role: 'admin'
            });
            res.json({
                success: true,
                data: { user }
            });
        } catch (err) {
            next(err);
        }
    }
    
    // Put /api/users/:id/setuser
    async setUser(req, res, next) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id,{
                role: 'user'
            });
            res.json({
                success: true,
                data: { user }
            });
        } catch (err) {
            next(err);
        }
    }
    
    // Delete /api/users/:id
    async deleteUser(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Kiểm tra xem user có đơn hàng nào không
            const orders = await Order.find({ user: user._id });
            
            if (orders.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete user because they have placed orders'
                });
            }

            // Nếu không có đơn hàng, mới xóa user
            await User.findByIdAndDelete(req.params.id);
            res.json({
                success: true,
                message: 'Xóa User thành công'
            });
        } catch (err) {
            next(err);
        }
    }   
}

module.exports = new UserController(); 