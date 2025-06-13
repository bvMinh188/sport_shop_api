
class UserController {
    // [GET] /profile
    profile(req, res, next) {
        res.render('user/profile');
    }

    // [GET] /users
    showUsers(req, res, next) {
        res.render('admin/userInfo');
    }
}

module.exports = new UserController(); 