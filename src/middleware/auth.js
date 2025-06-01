const jwt = require('jsonwebtoken');
const User = require('../app/models/User');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

const checkLogin = (req, res, next) => {
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
                    res.clearCookie('token');  // Clear invalid token
                    res.locals.user = null;
                }
                next();
            })
            .catch(err => {
                console.error("Lỗi khi tìm user:", err.message);
                res.clearCookie('token');  // Clear invalid token
                res.locals.user = null;
                next();
            });
    } catch (err) {
        console.error("Lỗi verify token:", err.message);
        res.clearCookie('token');  // Clear invalid token
        res.locals.user = null;
        next();
    }
};

module.exports = { checkLogin }; 