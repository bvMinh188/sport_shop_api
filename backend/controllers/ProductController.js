const Product = require('../models/Product')
const Category = require('../models/Category')
const { mongooseToObject, mutipleMongooseToObject } = require('../util/mongoose')
const slugify = require('slugify')

class ProductController {
    constructor() {
        // Bind methods to instance
        this.getAllProducts = this.getAllProducts.bind(this);
        this.getProductById = this.getProductById.bind(this);
        this.createProduct = this.createProduct.bind(this);
        this.updateProduct = this.updateProduct.bind(this);
        this.deleteProduct = this.deleteProduct.bind(this);
        this.getByCategory = this.getByCategory.bind(this);
        this.searchProducts = this.searchProducts.bind(this);
        this.filterProducts = this.filterProducts.bind(this);
    }
    
    // [GET] /api/products
    async getAllProducts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sort = req.query.sort || '-createdAt';

            const [products, total] = await Promise.all([
                Product.find({})
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                Product.countDocuments()
            ]);

            res.json({
                success: true,
                data: {
                    products: products,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalProducts: total
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/products/:id
    async getProductById(req, res, next) {
        try {
            const product = await Product.findById(req.params.id).lean();
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/products
    async createProduct(req, res, next) {
        try {
            const { name, description, category, price, image, sizes } = req.body;
            
            if (!name || !description || !category || !price || !image || !sizes) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Create slug
            const slug = slugify(name, { 
                lower: true, 
                locale: 'vi',
                strict: true
            });

            // Check for existing product
            const existingProduct = await Product.findOne({ slug });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this name already exists'
                });
            }

            const product = new Product({
                name,
                description,
                category,
                price,
                image,
                sizes,
                slug
            });

            await product.save();
            
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/products/:id
    async updateProduct(req, res, next) {
        try {
            const { name, description, category, price, image, sizes } = req.body;
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
            if (category) updateData.category = category;
            if (price) updateData.price = price;
            if (image) updateData.image = image;
            if (sizes) updateData.sizes = sizes;

            const product = await Product.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: { product }
            });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /api/products/:id
    async deleteProduct(req, res, next) {
        try {
            const product = await Product.findByIdAndDelete(req.params.id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/products/category/:category
    async getByCategory(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sort = req.query.sort || '-createdAt'; // <-- thêm dòng này
            const category = req.params.category;

            const [products, total] = await Promise.all([
                Product.find({ category })
                    .sort(sort) // <-- thêm dòng này
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                Product.countDocuments({ category })
            ]);

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalProducts: total
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/products/search
    async searchProducts(req, res, next) {
        try {
            const query = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sort = req.query.sort || '-createdAt';

            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const searchRegex = new RegExp(query, 'i');
            const [products, total] = await Promise.all([
                Product.find({ 
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex }
                    ]
                })
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                Product.countDocuments({
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex }
                    ]
                })
            ]);

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalProducts: total
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/products/filter
    async filterProducts(req, res, next) {
        try {
            const { minPrice, maxPrice, category, size } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const query = {};

            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = parseFloat(minPrice);
                if (maxPrice) query.price.$lte = parseFloat(maxPrice);
            }
            
            if (category) {
                query.category = category;
            }
            
            if (size) {
                query['sizes.size'] = parseInt(size);
            }

            const [products, total] = await Promise.all([
                Product.find(query)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                Product.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalProducts: total
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get /api/totalproducts
    async totalProducts(req, res, next) {
        try {
            const totalProducts = await Product.countDocuments();
            res.json({
                success: true,
                data: { totalProducts }
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ProductController();
