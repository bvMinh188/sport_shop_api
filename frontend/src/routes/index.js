const SiteController = require('../app/controllers/SiteController');
const siteRouter = require('./site');
const productsRouter = require('./products');
const adminRouter = require('./admin');
const authRouter = require('./auth');
const userRouter = require('./user');
const cartRouter = require('./cart');
const { checkLogin } = require('../middleware/auth');

function route(app){
    app.use('/products', productsRouter);
    app.use('/admin', checkLogin, (req, res, next) => {
        // Debug logs
        console.log('Cookies:', req.cookies);
        console.log('User from res.locals:', res.locals.user);
        
        // Kiểm tra thông tin user từ res.locals (được set bởi middleware checkLogin)
        if (!res.locals.user || res.locals.user.role !== 'admin') {
            console.log('Access denied - redirecting to home');
            return res.redirect('/'); // Chuyển về trang chủ nếu không phải admin
        }
        console.log('Access granted - continuing to admin router');
        next(); // Cho phép tiếp tục nếu là admin
    }, adminRouter);
    app.use('/auth', authRouter);
    app.use('/user', userRouter);
    app.use('/cart', cartRouter);
    // Site routes
    app.use('/', siteRouter);
}

module.exports = route;