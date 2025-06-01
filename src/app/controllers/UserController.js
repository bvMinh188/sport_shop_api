const User = require('../models/User');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');

class UserController {
    // [GET] /admin/users
    async showUsers(req, res, next) {
        try {
            const users = await User.find();
            res.render('admin/userInfo', { 
                user: mutipleMongooseToObject(users)
            });
        } catch (err) {
            next(err);
        }
    }

    // [GET] /admin/users/edit/:id
    async showUsersEdit(req, res, next) {
        try {
            const user = await User.findById(req.params.id);
            res.render('admin/userInfoEdit', { 
                user: mongooseToObject(user)
            });
        } catch (err) {
            next(err);
        }
    }

    // [PUT] /admin/users/:id/edited
    async showUsersEdited(req, res, next) {
        try {
            await User.updateOne({_id: req.params.id}, req.body);
            res.redirect('/admin/users');
        } catch (err) {
            next(err);
        }
    }

    // [DELETE] /admin/users/:id/deleted
    async showUsersDeleted(req, res, next) {
        try {
            await User.delete({ _id: req.params.id });
            res.redirect('/admin/users');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController(); 