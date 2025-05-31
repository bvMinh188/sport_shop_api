const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../app/models/User')
const siteController = require('../app/controllers/SiteController')
const dotenv = require('dotenv')
dotenv.config()

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Authentication middleware
const checkLogin = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, SECRET_CODE);
        User.findById(decoded._id)
            .then(user => {
                if (user) {
                    req.data = user;
                    res.locals.user = {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                } else {
                    res.locals.user = null;
                }
                next();
            })
            .catch(err => {
                console.error("Lỗi khi tìm user:", err.message);
                res.locals.user = null;
                next();
            });
    } catch (err) {
        console.error("Lỗi verify token:", err.message);
        res.locals.user = null;
        next();
    }
};

// Authentication routes
router.get('/register', siteController.register);
router.get('/login', checkLogin, siteController.login);
router.post('/logined', siteController.logined);
router.post('/logout', function (req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false, // Đổi thành true nếu bạn dùng HTTPS
        path: '/'
    });
    res.status(200).json({ message: 'Đã đăng xuất' });
});
router.post('/signup', siteController.signUp);

// Password reset routes
router.get('/forgot-password', siteController.forgotPassword);
router.post('/forgot-password', siteController.handleForgotPassword);
router.get('/reset-password/:token', siteController.showResetPassword);
router.post('/reset-password', siteController.handleResetPassword);

// Order routes
router.post('/order/:id', siteController.addProductCart);
router.get('/order', checkLogin, siteController.showOrder);
router.post('/checkout', checkLogin, siteController.checkout);
router.post('/update-order/:id', checkLogin, siteController.updateOrder);
router.delete('/delete-order/:id', checkLogin, siteController.deleteOrder);

// User profile and address routes
router.get('/account', checkLogin, siteController.profile);
router.post('/add-address', checkLogin, siteController.addAddress);
router.post('/set-default-address', checkLogin, siteController.setDefaultAddress);

// Search and product routes
router.get('/search', checkLogin, siteController.search);
router.get('/:slug', siteController.showProduct);
router.get('/', checkLogin, siteController.index);

module.exports = router;