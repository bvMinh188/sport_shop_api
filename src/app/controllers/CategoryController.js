const Category = require('../models/Category');
const Product = require('../models/Product');
const { mongooseToObject } = require('../../util/mongoose');
const slugify = require('slugify');

class CategoryController {
    // [GET] /admin/category
    async categoryList(req, res, next) {
        try {
            const categories = await Category.find({}).lean();
            const categoriesWithIndex = categories.map((category, index) => ({
                ...category,
                index: index + 1
            }));
            
            res.render('admin/category', {
                categories: categoriesWithIndex
            });
        } catch (err) {
            next(err);
        }
    }

    // [GET] /admin/category/add
    addCategory(req, res, next) {
        res.render('admin/addCategory');
    }

    // [POST] /admin/category/add
    async addedCategory(req, res, next) {
        try {
            const { name, description } = req.body;
            
            // Kiểm tra xem danh mục đã tồn tại chưa
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.render('admin/addCategory', {
                    error: 'Danh mục này đã tồn tại',
                    values: req.body
                });
            }

            const category = new Category({
                name,
                description,
                slug: slugify(name, { lower: true, locale: 'vi' })
            });

            await category.save();
            res.redirect('/admin/category');
        } catch (err) {
            res.render('admin/addCategory', {
                error: 'Có lỗi xảy ra khi thêm danh mục',
                values: req.body
            });
        }
    }

    // [GET] /admin/category/edit/:id
    async editCategory(req, res, next) {
        try {
            const category = await Category.findById(req.params.id).lean();
            if (!category) {
                return res.redirect('/admin/category');
            }
            res.render('admin/editCategory', {
                category: category
            });
        } catch (err) {
            next(err);
        }
    }

    // [PUT] /admin/category/edit/:id
    async updateCategory(req, res, next) {
        try {
            const { name, description } = req.body;
            
            // Kiểm tra xem tên mới đã tồn tại chưa (trừ category hiện tại)
            const existingCategory = await Category.findOne({ 
                name, 
                _id: { $ne: req.params.id } 
            });
            
            if (existingCategory) {
                return res.render('admin/editCategory', {
                    error: 'Danh mục này đã tồn tại',
                    category: { ...req.body, _id: req.params.id }
                });
            }

            await Category.findByIdAndUpdate(req.params.id, {
                name,
                description,
                slug: slugify(name, { lower: true, locale: 'vi' })
            });

            res.redirect('/admin/category');
        } catch (err) {
            res.render('admin/editCategory', {
                error: 'Có lỗi xảy ra khi cập nhật danh mục',
                category: { ...req.body, _id: req.params.id }
            });
        }
    }

    // [DELETE] /admin/category/delete/:id
    async delete(req, res, next) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy danh mục'
                });
            }

            // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
            const productsInCategory = await Product.countDocuments({ category: category.name });
            if (productsInCategory > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa danh mục này vì đang có sản phẩm thuộc danh mục'
                });
            }

            await Category.findByIdAndDelete(req.params.id);
            
            res.status(200).json({
                success: true,
                message: 'Đã xóa danh mục thành công'
            });
        } catch (err) {
            console.error('Error in delete:', err);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi xóa danh mục',
                error: err.message
            });
        }
    }
}

module.exports = new CategoryController(); 