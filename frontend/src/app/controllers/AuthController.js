
class AuthController {
    // [GET] /register
    register(req, res, next) {
        res.render('user/register');
    }

    // [GET] /login
    login(req, res, next) {
        res.render('user/login');
    }

    // [GET] /forgot-password
    forgotPassword(req, res) {
        res.render('user/forgot-password');
    }

    // [GET] /reset-password/:token
    async showResetPassword(req, res) {
        res.render('user/reset-password')
    }

}

module.exports = new AuthController(); 