class ProductController {
    
    async edit(req, res, next) {
        res.render('admin/editProduct');
    }

    async productList(req, res, next) {
        res.render('admin/product');
    }

    async addProduct(req, res, next) {
        res.render('admin/addProduct');
    }

    async showProduct(req, res, next) {
        res.render('products/show')
    }

    async search(req, res) {
        res.render('products/search');
    }
}

module.exports = new ProductController();
