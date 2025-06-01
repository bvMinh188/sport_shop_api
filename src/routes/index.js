const SiteController = require('../app/controllers/SiteController');
const siteRouter = require('./site');
const productsRouter = require('./products');
const adminRouter = require('./admin');
const authRouter = require('./auth');
const userRouter = require('./user');
const cartRouter = require('./cart');
const orderRouter = require('./order');

function route(app){
    app.use('/products', productsRouter);
    app.use('/admin', adminRouter);
    app.use('/auth', authRouter);
    app.use('/user', userRouter);
    app.use('/cart', cartRouter);
    app.use('/order', orderRouter);
    // Site routes
    app.use('/', siteRouter);
}

module.exports = route;