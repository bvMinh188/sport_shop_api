const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const adminController = require('../app/controllers/AdminController');
const productController = require('../app/controllers/ProductController');
const categoryController = require('../app/controllers/CategoryController');
const orderController = require('../app/controllers/OrderController');
const userController = require('../app/controllers/UserController');

const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Middleware set layout cho admin
var setAdminLayout = (req, res, next) => {
    res.locals.layout = 'admin';
    next();
};

// Áp dụng middleware setAdminLayout cho tất cả route
router.use(setAdminLayout);

// Home routes
router.get('/home',  adminController.home);

// Product routes
router.get('/product',  productController.productList);
router.get('/product/add', productController.addProduct);
router.get('/product/edit/:id',productController.edit);

// Category routes
router.get('/category',categoryController.categoryList);
router.get('/category/add',categoryController.addCategory);
router.get('/category/edit/:id', categoryController.editCategory);

// User routes
router.get('/users',userController.showUsers);

// Order routes
router.get('/order',orderController.transaction);

module.exports = router;
