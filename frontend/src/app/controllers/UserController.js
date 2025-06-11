const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');

class UserController {
    // [GET] /profile
    profile(req, res, next) {
        res.render('user/profile');
    }

    // [POST] /account/updateprofile
    async updateProfile(req, res) {
        try {
            const { username, email, phone } = req.body;
            const token = req.cookies.token;
            
            if (!token) {
                return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const userId = decodeToken._id;

            await User.findByIdAndUpdate(userId, {
                username,
                email,
                phone
            });

            res.json({ success: true, message: 'Cập nhật thông tin thành công' });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật thông tin' });
        }
    }

    // [POST] /add-address
    async addAddress(req, res, next) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const { name, address, isDefault } = req.body;

            if (!name || !address) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng nhập đầy đủ thông tin địa chỉ' 
                });
            }

            const user = await User.findById(decodeToken._id);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Không tìm thấy người dùng' 
                });
            }

            if (isDefault) {
                user.addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }

            user.addresses.push({
                name,
                address,
                isDefault: isDefault || user.addresses.length === 0
            });

            await user.save();

            res.json({ 
                success: true, 
                message: 'Thêm địa chỉ thành công',
                address: user.addresses[user.addresses.length - 1]
            });
        } catch (err) {
            console.error('Error in addAddress:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Có lỗi xảy ra khi thêm địa chỉ',
                error: err.message 
            });
        }
    }

    // [POST] /set-default-address
    async setDefaultAddress(req, res) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const { addressId } = req.body;

            const user = await User.findById(decodeToken._id);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Không tìm thấy người dùng' 
                });
            }

            if (addressId < 0 || addressId >= user.addresses.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Địa chỉ không hợp lệ'
                });
            }

            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });

            user.addresses[addressId].isDefault = true;

            await user.save();

            res.json({ 
                success: true, 
                message: 'Đã cập nhật địa chỉ mặc định'
            });
        } catch (err) {
            console.error('Error in setDefaultAddress:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Có lỗi xảy ra khi cập nhật địa chỉ mặc định',
                error: err.message 
            });
        }
    }

    // [GET] /admin/users
    async showUsers(req, res, next) {
        try {
            const users = await User.find();
            res.render('admin/userInfo', { 
                user: mutipleMongooseToObject(users)
            });
        } catch (err) {
            next(err);
        }
    }

    // [GET] /admin/users/edit/:id
    async showUsersEdit(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            res.render('admin/userInfoEdit', { 
                user: mongooseToObject(user)
            });
        } catch (err) {
            next(err);
        }
    }

    // [PUT] /admin/users/:id/edited
    async showUsersEdited(req, res, next) {
        try {
            await User.updateOne({_id: req.params.id}, req.body);
            res.redirect('/admin/users');
        } catch (err) {
            next(err);
        }
    }

    // [DELETE] /users/:id/deleted
    async DeletedUser(req, res, next) {
        try {
            const userId = req.params.id;
            
            // Kiểm tra user tồn tại
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Kiểm tra không cho phép xóa tài khoản admin
            if (user.role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Không thể xóa tài khoản admin'
                });
            }

            // Kiểm tra xem người dùng đã có đơn hàng nào chưa
            const existingOrders = await Order.findOne({ userId: userId });
            if (existingOrders) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa người dùng đã có đơn hàng trong hệ thống'
                });
            }

            // Thực hiện xóa user
            await User.findByIdAndDelete(userId);
            
            // Trả về response thành công
            return res.status(200).json({
                success: true,
                message: 'Xóa người dùng thành công'
            });
        } catch (err) {
            console.error('Error in DeletedUser:', err);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi xóa người dùng',
                error: err.message
            });
        }
    }
}

module.exports = new UserController(); 