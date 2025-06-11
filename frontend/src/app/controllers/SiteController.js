const Product = require('../models/Product');
const { mutipleMongooseToObject } = require('../../util/mongoose');
const axios = require('axios');

class SiteController {
    //[Get] /
    async index(req, res, next) {
        try {
            res.render('home');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SiteController;
