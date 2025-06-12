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
            res.render('admin/home', {
                isHome: true
            });
        } catch (err) {
            next(err);
        }
    }

}
   
module.exports = new AdminController;
