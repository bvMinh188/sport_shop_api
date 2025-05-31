const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../app/models/User');

const adminController = require('../app/controllers/AdminController');
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


router.get('/admin/addProduct',checkLogin, checkUser, adminController.addProduct);
router.post('/admin/added',checkLogin, checkUser, adminController.added);

router.get('/admin/addCategory',checkLogin, checkUser, adminController.addCategory);
router.post('/admin/addedCategory',checkLogin, checkUser, adminController.addedCategory);

router.get('/admin/:id/edit', adminController.edit);
router.put('/admin/:id', adminController.update);
router.delete('/admin/:id', adminController.delete)

router.get('/admin/users/:id/edit', checkLogin, checkUser, adminController.showUsersEdit);
router.get('/admin/users/:id/delete', checkLogin, checkUser, adminController.showUsersDelete);

router.put('/admin/users/:id/edited', checkLogin, checkUser, adminController.showUsersEdited);
router.delete('/admin/users/:id/deleted', checkLogin, checkUser, adminController.showUsersDeleted);
router.delete('/admin/transaction/:id', checkLogin, checkUser, adminController.deleteOrder);
router.patch('/admin/transaction/:id/complete', checkLogin, checkUser, adminController.completeOrder);
router.patch('/admin/transaction/:id/confirm', checkLogin, checkUser, adminController.confirmOrder);
router.get('/admin/transaction', checkLogin, checkUser, adminController.transaction);
router.get('/admin/users', checkLogin, checkUser, adminController.showUsers);
router.get('/admin', checkLogin, checkUser, adminController.storedProducts);





module.exports = router;
