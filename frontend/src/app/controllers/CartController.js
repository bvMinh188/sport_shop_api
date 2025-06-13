
class CartController {
    // [GET] /show
    showCart(req, res, next) {
        res.render('user/order');
    }
}

module.exports = new CartController(); 