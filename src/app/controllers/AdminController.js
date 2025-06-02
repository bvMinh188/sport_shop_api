const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');


class AdminController{
    //[GET] /admin/home
    async home(req, res, next) {
        try {
            const totalCategories = await Category.countDocuments();
            const totalProducts = await Product.countDocuments();
            const totalOrders = await Order.countDocuments();
            const totalUsers = await User.countDocuments();

            res.render('admin/home', {
                totalCategories,
                totalProducts,
                totalOrders,
                totalUsers,
                isHome: true
            });
        } catch (err) {
            next(err);
        }
    }

}
   
module.exports = new AdminController;
