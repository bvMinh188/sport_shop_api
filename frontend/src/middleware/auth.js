const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.JWT_SECRET || 'your-secret-key';

const checkLogin = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, SECRET_CODE);
        if (decoded && decoded.id) {
            // Parse userInfo from cookie
            let userInfo = null;
            try {
                userInfo = JSON.parse(req.cookies?.userInfo || '{}');
            } catch (e) {
                console.error('Error parsing userInfo:', e);
            }

            res.locals.user = {
                _id: decoded.id,
                ...userInfo
            };

            // Debug log
            console.log('Current user:', res.locals.user);
        } else {
            res.locals.user = null;
        }
        next();
    } catch (err) {
        console.error("Lỗi verify token:", err.message);
        res.locals.user = null;
        next();
    }
};

module.exports = { checkLogin }; 