const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../app/models/User');

const adminController = require('../app/controllers/AdminController');
const productController = require('../app/controllers/ProductController');
const categoryController = require('../app/controllers/CategoryController');
const orderController = require('../app/controllers/OrderController');
const userController = require('../app/controllers/UserController');

const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Middleware kiểm tra đăng nhập
var checkLogin = (req, res, next) => {
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

// Middleware kiểm tra quyền admin
var checkUser = (req, res, next) => {
    if (req.data) {
        var role = req.data.role;
        if (role === 'admin') {
            // Cho phép tiếp tục
            next();
        } else {
            // Không phải admin → cấm truy cập
            return res.redirect('/');
        }
    } else {
        // Không có thông tin người dùng → cấm truy cập
        return res.redirect('/');
    }
};

// Middleware set layout cho admin
var setAdminLayout = (req, res, next) => {
    res.locals.layout = 'admin';
    next();
};

// Áp dụng middleware setAdminLayout cho tất cả route
router.use(setAdminLayout);

// Home routes
router.get('/home', checkLogin, checkUser, adminController.home);

// Product routes
router.get('/product', checkLogin, checkUser, productController.productList);
router.get('/product/add', checkLogin, checkUser, productController.addProduct);
router.post('/product/add', checkLogin, checkUser, productController.added);
router.get('/product/edit/:id', checkLogin, checkUser, productController.edit);
router.put('/product/edit/:id', checkLogin, checkUser, productController.update);
router.delete('/product/delete/:id', checkLogin, checkUser, productController.delete);

// Category routes
router.get('/category', checkLogin, checkUser, categoryController.categoryList);
router.get('/category/add', checkLogin, checkUser, categoryController.addCategory);
router.post('/category/add', checkLogin, checkUser, categoryController.addedCategory);
router.get('/category/edit/:id', checkLogin, checkUser, categoryController.editCategory);
router.put('/category/edit/:id', checkLogin, checkUser, categoryController.updateCategory);
router.delete('/category/delete/:id', checkLogin, checkUser, categoryController.delete);

// User routes
router.get('/users', checkLogin, checkUser, userController.showUsers);
router.get('/users/edit/:id', checkLogin, checkUser, userController.showUsersEdit);
router.put('/users/:id/edited', checkLogin, checkUser, userController.showUsersEdited);
router.delete('/users/:id/deleted', checkLogin, checkUser, userController.showUsersDeleted);

// Order routes
router.get('/transaction', checkLogin, checkUser, adminController.transaction);
router.get('/transaction/:id/detail', checkLogin, checkUser, adminController.getOrderDetail);
router.patch('/transaction/:id/confirm', checkLogin, checkUser, adminController.confirmOrder);
router.patch('/transaction/:id/complete', checkLogin, checkUser, adminController.completeOrder);
router.delete('/transaction/:id', checkLogin, checkUser, adminController.deleteOrder);

module.exports = router;
