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
    var token = req.cookies?.token;
    if (!token) {
        // Nếu không có token, chuyển hướng đến trang đăng nhập
        return res.redirect('/');
    } else {
        try {
            // Xác minh token
            var idUser = jwt.verify(token, SECRET_CODE);
            User.findOne({ _id: idUser._id })
                .then(data => {
                    if (!data) {
                        // Nếu không tìm thấy người dùng, chuyển hướng đến trang đăng nhập
                        return res.redirect('/');
                    }
                    req.data = data;
                    next();
                })
                .catch(err => {
                    console.log("Database error:", err.message);
                    return res.redirect('/');
                });
        } catch (err) {
            console.log("Invalid token:", err.message);
            return res.redirect('/');
        }
    }
};

// Middleware kiểm tra quyền admin
var checkUser = (req, res, next) => {
    if (req.data) {
        var role = req.data.role;
        if (role === 'admin') {
            // Chỉ cho phép admin truy cập
            next();
        } else {
            // Nếu không phải admin, chuyển hướng về trang chủ
            res.redirect('/');
        }
    } else {
        // Nếu không có dữ liệu người dùng, chuyển hướng về trang đăng nhập
        res.redirect('/');
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
