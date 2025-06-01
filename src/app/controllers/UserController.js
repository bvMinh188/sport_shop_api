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
        const token = req.cookies.token;
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                User.findById(decodeToken._id)
                    .then(userInfo => {
                        if (!userInfo) {
                            return res.redirect('/auth/login'); 
                        }
                        Order.find({ userId: decodeToken._id })
                            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần (mới nhất lên đầu)
                            .then(order => {
                                res.render('user/profile', {
                                    userInfo: mongooseToObject(userInfo),
                                    order: mutipleMongooseToObject(order)
                                });
                            })
                            .catch(next);
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/auth/login');
            }
        } else {
            res.redirect('/auth/login');
        }
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

    // [DELETE] /admin/users/:id/deleted
    async showUsersDeleted(req, res, next) {
        try {
            await User.delete({ _id: req.params.id });
            res.redirect('/admin/users');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController(); 