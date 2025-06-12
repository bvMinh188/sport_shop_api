const Product = require('../models/Product')
const productRepo = require('../repositories/ProductRepository')
const Category = require('../models/Category')
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose')
const slugify = require('slugify')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const axios = require('axios')

dotenv.config()

const SECRET_CODE = process.env.SECRET_CODE || 'Minh'

class ProductController {
    constructor() {
        // Bind các phương thức với instance
        this.create = this.create.bind(this);
        this.edit = this.edit.bind(this);
        this.store = this.store.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.productList = this.productList.bind(this);
        this.addProduct = this.addProduct.bind(this);
        this.added = this.added.bind(this);
        this.showProduct = this.showProduct.bind(this);
        this.search = this.search.bind(this);
        this.getByCategory = this.getByCategory.bind(this);
        this.filter = this.filter.bind(this);
    }
    
    async create(req, res, next) {
        try {
            const categories = await Category.find({});
            const sizes = [38,39,40,41,42,43,44];
            res.render('products/create', { 
                sizes: sizes,
                categories: mutipleMongooseToObject(categories)
            });
        } catch (err) {
            next(err);
        }
    }

    async edit(req, res, next) {
        try {
            const product = await productRepo.findById(req.params.id);
            const categories = await Category.find({}).lean();
            res.render('admin/editProduct', {
                product: mongooseToObject(product),
                categories: categories
            });
        } catch (err) {
            next(err);
        }
    }

    async store(req, res, next) {
        try {
            const { name, description, category, price, image, sizes } = req.body;
            
            // Xử lý và validate sizes
            const formattedSizes = Array.isArray(sizes) ? sizes.map(size => ({
                size: parseInt(size.size),
                quantity: parseInt(size.quantity) || 0
            })).filter(size => !isNaN(size.size) && !isNaN(size.quantity)) : [];

            // Tạo slug
            const slug = slugify(name, { 
                lower: true, 
                locale: 'vi',
                strict: true
            });

            // Tạo sản phẩm mới trực tiếp
            const product = new Product({
                name,
                description,
                category,
                price: parseFloat(price),
                image,
                sizes: formattedSizes,
                slug
            });

            await product.save();
            
            res.redirect('/');
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { name, description, category, price, image, sizes } = req.body;
            
            // Xử lý và validate sizes
            const formattedSizes = Array.isArray(sizes) ? sizes.map(size => ({
                size: parseInt(size.size),
                quantity: parseInt(size.quantity) || 0
            })).filter(size => !isNaN(size.size) && !isNaN(size.quantity)) : [];

            // Tạo slug
            const slug = slugify(name, { 
                lower: true, 
                locale: 'vi',
                strict: true
            });

            await productRepo.update(req.params.id, {
                ...req.body,
                sizes: formattedSizes,
                slug
            });
            res.redirect('/admin/product');
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            const product = await productRepo.findById(req.params.id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            await productRepo.delete(req.params.id);
            
            res.status(200).json({
                success: true,
                message: 'Đã xóa sản phẩm thành công'
            });
        } catch (err) {
            console.error('Error in delete:', err);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi xóa sản phẩm',
                error: err.message
            });
        }
    }

    async productList(req, res, next) {
            res.render('admin/product');
    }

    async addProduct(req, res, next) {
        try {
            const categories = await Category.find({}).lean();
            const sizes = [38,39,40,41,42,43,44];
            res.render('admin/addProduct', { 
                sizes: sizes,
                categories: categories
            });
        } catch (err) {
            next(err);
        }
    }

    async added(req, res, next) {
        try {
            const { name, description, category, price, image, sizes } = req.body;
            
            if (!name || !description || !category || !price || !image) {
                return res.render('admin/addProduct', {
                    error: 'Vui lòng điền đầy đủ thông tin',
                    categories: await Category.find({}).lean(),
                    sizes: [38,39,40,41,42,43,44],
                    values: req.body
                });
            }

            const existingProduct = await productRepo.findOne({ name });
            if (existingProduct) {
                return res.render('admin/addProduct', {
                    error: 'Sản phẩm này đã tồn tại',
                    categories: await Category.find({}).lean(),
                    sizes: [38,39,40,41,42,43,44],
                    values: req.body
                });
            }

            const formattedSizes = Array.isArray(sizes) ? sizes.map(size => ({
                size: parseInt(size.size),
                quantity: parseInt(size.quantity) || 0
            })).filter(size => !isNaN(size.size) && !isNaN(size.quantity)) : [];

            const slug = slugify(name, { 
                lower: true, 
                locale: 'vi',
                strict: true
            });

            // Tạo sản phẩm mới trực tiếp
            const product = new Product({
                name,
                description,
                category,
                price: parseFloat(price),
                image,
                sizes: formattedSizes,
                slug
            });

            await product.save();

            res.redirect('/admin/product');
        } catch (err) {
            console.error('Error in added:', err);
            res.render('admin/addProduct', {
                error: 'Có lỗi xảy ra khi thêm sản phẩm',
                categories: await Category.find({}).lean(),
                sizes: [38,39,40,41,42,43,44],
                values: req.body
            });
        }
    }

    async showProduct(req, res, next) {
        try {
            const id = req.params.id;
            res.render('products/show');
        } catch (err) {
            console.error("Lỗi khi truy vấn sản phẩm:", err);
            next(err);
        }
    }

    async search(req, res) {
        try {
            res.render('products/search');
        } catch (error) {
            console.error('Search error:', error);
            next(error);
        }
    }

    async getByCategory(req, res, next) {
        try {
            const category = req.params.category;
            const page = parseInt(req.query.page) || 1;
            const limit = 12;
            const skip = (page - 1) * limit;

            const [products, totalProducts, categories] = await Promise.all([
                productRepo.findByCategory(category),
                productRepo.count({ category }),
                Product.distinct("category")
            ]);

            const totalPages = Math.ceil(totalProducts / limit);

            res.render('products/category', {
                products: products,
                category: category,
                categories: categories,
                currentPage: page,
                totalPages: totalPages,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Category error:', error);
            next(error);
        }
    }

    async filter(req, res, next) {
        try {
            const { minPrice, maxPrice, category, sort } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = 12;
            const skip = (page - 1) * limit;

            let query = {};

            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = parseInt(minPrice);
                if (maxPrice) query.price.$lte = parseInt(maxPrice);
            }

            if (category) {
                query.category = category;
            }

            let sortQuery = {};
            if (sort === 'price_asc') {
                sortQuery.price = 1;
            } else if (sort === 'price_desc') {
                sortQuery.price = -1;
            } else if (sort === 'newest') {
                sortQuery.createdAt = -1;
            } else if (sort === 'bestseller') {
                sortQuery.sold = -1;
            }

            const [products, totalProducts, categories] = await Promise.all([
                productRepo.findWithPagination(query, sortQuery, skip, limit),
                productRepo.count(query),
                Product.distinct("category")
            ]);

            const totalPages = Math.ceil(totalProducts / limit);

            res.render('products/filter', {
                products: products,
                categories: categories,
                currentPage: page,
                totalPages: totalPages,
                filters: {
                    minPrice,
                    maxPrice,
                    category,
                    sort
                },
                user: res.locals.user
            });
        } catch (error) {
            console.error('Filter error:', error);
            next(error);
        }
    }
}

module.exports = new ProductController();
