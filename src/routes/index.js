const SiteController = require('../app/controllers/SiteController');
const siteRouter = require('./site');
const productsRouter = require('./products');
const adminRouter = require('./admin');

function route(app){
    app.use('/products', productsRouter);
    app.use('/admin', adminRouter);
    app.use('/', siteRouter);
}

module.exports = route;