
class SiteController {
    //[Get] /
    async index(req, res, next) {
        res.render('home');
    }
}

module.exports = new SiteController;
