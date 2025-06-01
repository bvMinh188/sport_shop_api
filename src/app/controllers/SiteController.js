const Product = require('../models/Product');
const { mutipleMongooseToObject } = require('../../util/mongoose');

class SiteController {
    //[Get] /
    index(req, res, next) {
        let page = parseInt(req.query.page) || 1;
        let limit = 12;
        let skip = (page - 1) * limit;
    
        let filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
    
        let productQuery = Product.find(filter);
    
        if (req.query._sort) {
            productQuery = productQuery.sort({ price: req.query._sort });
        }
    
        Promise.all([
            productQuery.skip(skip).limit(limit),
            Product.countDocuments(filter),
            Product.distinct("category"),
            Product.find().sort({ sold: -1 }).limit(4)
        ])
        .then(([products, totalProducts, categories, topProducts]) => {
            const totalPages = Math.ceil(totalProducts / limit);
    
            res.render('home', {
                categories: categories,
                products: mutipleMongooseToObject(products),
                topProducts: mutipleMongooseToObject(topProducts),
                currentPage: page,
                totalPages: totalPages,
                selectedCategory: req.query.category || null,
                _sort: req.query._sort || "",
            });
        })
        .catch(next);
    }
}

module.exports = new SiteController;
