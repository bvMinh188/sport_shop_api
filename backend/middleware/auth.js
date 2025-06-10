const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

        if (!token || typeof token !== 'string' || token.length < 10) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }

        const decoded = jwt.verify(token, SECRET_CODE);
        
        let user;
        try {
            user = await User.findById(decoded.id);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = {
            id: user._id,
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        next(error);
    }
};

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

module.exports = verifyToken; 