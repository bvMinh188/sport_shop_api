const Category = require('../models/Category');
const Product = require('../models/Product');
const { mongooseToObject, mutipleMongooseToObject } = require('../util/mongoose');
const slugify = require('slugify');

class CategoryController {
    constructor() {
        // Bind methods to instance
        this.getAllCategories = this.getAllCategories.bind(this);
        this.getCategoryById = this.getCategoryById.bind(this);
        this.createCategory = this.createCategory.bind(this);
        this.updateCategory = this.updateCategory.bind(this);
        this.deleteCategory = this.deleteCategory.bind(this);
        this.getCategoryProducts = this.getCategoryProducts.bind(this);
    }

    // [GET] /api/categories
    async getAllCategories(req, res, next) {
        try {
            const categories = await Category.find({}).lean();
            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/categories/:id
    async getCategoryById(req, res, next) {
        try {
            const category = await Category.findById(req.params.id).lean();
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.json({
                success: true,
                data: { category }
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/categories
    async createCategory(req, res, next) {
        try {
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required'
                });
            }

            // Create slug
            const slug = slugify(name, {
                lower: true,
                locale: 'vi',
                strict: true
            });

            // Check for existing category
            const existingCategory = await Category.findOne({ slug });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh mục này đã tồn tại'
                });
            }

            const category = new Category({
                name,
                description,
                slug
            });

            await category.save();

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: { category }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/categories/:id
    async updateCategory(req, res, next) {
        try {
            const { name, description } = req.body;
            const updateData = {};

            if (name) {
                updateData.name = name;
                updateData.slug = slugify(name, {
                    lower: true,
                    locale: 'vi',
                    strict: true
                });
            }
            if (description) updateData.description = description;

            const category = await Category.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.json({
                success: true,
                message: 'Category updated successfully',
                data: { category }
            });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /api/categories/:id
    async deleteCategory(req, res, next) {
        try {
            const category = await Category.findById(req.params.id);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Kiểm tra xem category có được sử dụng trong products không
            const products = await Product.find({ category: category.name });
            if (products.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh mục này đang có sản phẩm đang bán'
                });
            }

            // Xóa category
            await Category.deleteOne({ _id: category._id });

            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Get /api/categories/:id/products
    async getCategoryProducts(req, res, next) {
        try {
            const category = await Category.findById(req.params.id);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const products = await Product.find({ category: category.name });
            
            res.json({
                success: true,
                category: mongooseToObject(category),
                products: mutipleMongooseToObject(products)
            });
        } catch (err) {
            next(err);
        }
    }
    
    // Get /api/totalcategories
    async totalCategories(req, res, next) {
        try {
            const totalCategories = await Category.countDocuments();
            res.json({
                success: true,
                data: { totalCategories }
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new CategoryController(); 