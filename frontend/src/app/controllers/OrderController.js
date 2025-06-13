
class OrderController {

    //[GET] /admin/transaction
    async transaction(req, res, next) {
        res.render('admin/transaction');
    }
}

module.exports = new OrderController(); 