
class AdminController{
    //[GET] /admin/home
    async home(req, res, next) {
        res.render('admin/home');
    }

}
   
module.exports = new AdminController;
