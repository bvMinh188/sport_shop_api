const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../../util/mailjet');
const dotenv = require('dotenv');


dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

class AuthController {
    // [GET] /register
    register(req, res, next) {
        res.render('user/register');
    }

    // [POST] /signup
    async signUp(req, res, next) {
        try {
            const { email, password, username, phone } = req.body;

            // Kiểm tra email đã tồn tại
            const userByEmail = await User.findOne({ email: email });
            if (userByEmail) {
                return res.json({ message: 'email đã được đăng ký' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

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
            res.json({ message: "success" });
        } catch (error) {
            console.error("Lỗi khi đăng ký:", error);
            res.status(500).json({ message: "error" });
        }
    }

    // [GET] /login
    login(req, res, next) {
        res.render('user/login');
    }

    // [POST] /logined
    logined(req, res, next) {
        const { email, password } = req.body;

        User.findOne({ email: email })
            .then(userByEmail => {
                if (!userByEmail) {
                    return res.json({ message: 'tài khoản không tồn tại' });
                }

                bcrypt.compare(password, userByEmail.password)
                    .then(isMatch => {
                        if (isMatch) {
                            const token = jwt.sign({ _id: userByEmail._id }, SECRET_CODE);
                            
                            res.cookie('token', token, {
                                httpOnly: true,
                                maxAge: 24 * 60 * 60 * 1000, // 1 ngày
                                sameSite: 'Lax',
                                secure: false // Chuyển thành true nếu dùng HTTPS
                            });

                            return res.json({ message: userByEmail.role });
                        } else {
                            return res.json({ message: 'sai mật khẩu' });
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        return res.status(500).json({ message: 'đã xảy ra lỗi' });
                    });
            })
            .catch(error => {
                console.error(error);
                return res.status(500).json({ message: 'đã xảy ra lỗi' });
            });
    }

    // [GET] /forgot-password
    forgotPassword(req, res) {
        res.render('user/forgot-password');
    }

    // [POST] /forgot-password
    async handleForgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Email không tồn tại trong hệ thống'
                });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Cập nhật thông tin reset password
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
            await user.save();

            await sendPasswordResetEmail(email, resetToken);

            res.json({
                success: true,
                message: 'Link đặt lại mật khẩu đã được gửi vào email của bạn'
            });
        } catch (error) {
            console.error('Lỗi khi xử lý quên mật khẩu:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
            });
        }
    }

    // [GET] /reset-password/:token
    async showResetPassword(req, res) {
        try {
            const { token } = req.params;
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.render('error', {
                    message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
                });
            }

            res.render('user/reset-password', { token });
        } catch (error) {
            console.error('Lỗi khi hiển thị trang đặt lại mật khẩu:', error);
            res.render('error', {
                message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
            });
        }
    }

    // [POST] /reset-password
    async handleResetPassword(req, res) {
        try {
            const { token, password } = req.body;
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
                });
            }

            // Hash và cập nhật mật khẩu mới
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Đặt lại mật khẩu thành công'
            });
        } catch (error) {
            console.error('Lỗi khi đặt lại mật khẩu:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi đặt lại mật khẩu'
            });
        }
    }

    // [POST] /auth/logout
    logout(req, res) {
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'Lax',
            secure: false // Giữ false vì đang dùng HTTP
        });
        res.json({ message: 'success' });
    }
}

module.exports = new AuthController(); 