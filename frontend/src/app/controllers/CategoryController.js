
class CategoryController {
    // [GET] /admin/category
    categoryList(req, res) {
        res.render('admin/category');
    }

    // [GET] /admin/category/add
    addCategory(req, res) {
        res.render('admin/addCategory');
    }

    // [GET] /admin/category/edit/:id
    editCategory(req, res) {
        res.render('admin/editCategory');
    }
}

module.exports = new CategoryController(); 