const Product = require('../models/Product')
const productRepo = require('../repositories/ProductRepository')
const Category = require('../models/Category')
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose')
const slugify = require('slugify')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const axios = require('axios')
const ProductFactory = require('../factories/ProductFactory')

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

            const productData = {
                name,
                description,
                category,
                price: parseFloat(price),
                image,
                sizes: formattedSizes,
                slug
            };

            // Sử dụng ProductFactory thay vì tạo trực tiếp
            const product = ProductFactory.createProduct(productData);
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
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 10;
            let skip = (page - 1) * limit;
        
            let filter = {};
            if (req.query.category) {
                filter.category = req.query.category;
            }
        
            let sort = {};
            if (req.query._sort) {
                sort.price = parseInt(req.query._sort);
            } else {
                sort.createdAt = -1;
            }

            const [products, totalProducts, categories] = await Promise.all([
                productRepo.findWithPagination(filter, sort, skip, limit),
                productRepo.count(filter),
                Category.find({}).distinct('name')
            ]);

            const productsWithTotalQuantity = products.map(product => {
                const totalQuantity = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
                return {
                    ...product,
                    totalQuantity
                };
            });

            const totalPages = Math.ceil(totalProducts / limit);
    
            res.render('admin/product', {
                categories: categories,
                products: productsWithTotalQuantity,
                currentPage: page,
                totalPages: totalPages,
                selectedCategory: req.query.category || '',
                _sort: req.query._sort || '',
                totalProducts: totalProducts,
                startIndex: skip + 1,
                endIndex: Math.min(skip + limit, totalProducts)
            });
        } catch (err) {
            console.error('Error in productList:', err);
            next(err);
        }
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

            const productData = {
                name,
                description,
                category,
                price: parseFloat(price),
                image,
                sizes: formattedSizes,
                slug
            };

            // Sử dụng ProductFactory thay vì tạo trực tiếp
            const product = ProductFactory.createProduct(productData);
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
        const slug = req.params.slug;
        const token = req.cookies.token;

        const getUserInfo = token ? 
            new Promise((resolve) => {
                try {
                    const decodeToken = jwt.verify(token, SECRET_CODE);
                    User.findById(decodeToken._id)
                        .lean()
                        .then(user => resolve(user))
                        .catch(() => resolve(null));
                } catch (err) {
                    resolve(null);
                }
            })
            : Promise.resolve(null);

        try {
            const [product, user] = await Promise.all([
                productRepo.findBySlug(slug),
                getUserInfo
            ]);

            if (!product) {
                return res.status(404).render('errors/404', { 
                    message: "Không tìm thấy sản phẩm.",
                    user: user
                });
            }

            const apiUrl = `http://localhost:5555/api?id=${product._id.toString()}`;

            try {
                const response = await axios.get(apiUrl);
                if (response.data && response.data['san pham goi y']) {
                    const suggestedIds = response.data['san pham goi y'];
                    const suggestedProducts = await productRepo.findWithSuggestions(suggestedIds);

                    return res.render('products/show', {
                        product: mongooseToObject(product),
                        products: suggestedProducts,
                        user: user
                    });
                }
                
                res.render('products/show', {
                    product: mongooseToObject(product),
                    products: [],
                    user: user
                });
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu sản phẩm gợi ý từ API:", error.message);
                res.render('products/show', {
                    product: mongooseToObject(product),
                    products: [],
                    user: user
                });
            }
        } catch (err) {
            console.error("Lỗi khi truy vấn sản phẩm:", err);
            next(err);
        }
    }

    async search(req, res) {
        try {
            const searchQuery = req.query.q || '';
            
            if (!searchQuery.trim()) {
                return res.redirect('/');
            }

            const products = await productRepo.search(searchQuery);

            res.render('products/search', {
                products,
                searchQuery,
                title: `Kết quả tìm kiếm cho "${searchQuery}"`,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).render('error', {
                message: 'Đã xảy ra lỗi trong quá trình tìm kiếm',
                user: res.locals.user
            });
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
