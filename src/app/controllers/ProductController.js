const Product = require('../models/Product')
const Category = require('../models/Category')
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose')
const slugify = require('slugify')

class ProductController{
    
    show(req, res, next){
        Product.findOne({ slug: req.params.slug })
        .then(product => {
            
            res.render('products/show', { product : mongooseToObject(product) });
        })
        .catch(next);
    }

    create(req, res, next) {
        Category.find({})
            .then(categories => {
                const sizes = [38,39,40,41,42,43,44]
                res.render('products/create', { 
                    sizes : sizes,
                    categories: mutipleMongooseToObject(categories) // Chuyển danh sách categories thành đối tượng bình thường
                });
            })
            .catch(next);
    }
    

    edit(req, res, next) {
        Product.findById(req.params.id)
            .then(product => {
                res.render('products/edit', {
                    product: mongooseToObject(product)
                });
            })
            .catch(next); // Xử lý lỗi nếu xảy ra
    }
    
   
    store(req, res, next) {

        const product = new Product(req.body)
    
        product.save()
            .then(() => {
                res.redirect('/');

            })
            .catch(next);
    }

    update(req, res, next){
        Product.updateOne({_id: req.params.id}, req.body)
            .then(() => res.redirect('/admin/stored/products'))
            .catch(next);
    }

    async delete(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            await Product.findByIdAndDelete(req.params.id);
            
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

    // [GET] /admin/product
    async productList(req, res, next) {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 10; // Giảm số lượng item mỗi trang để dễ quản lý
            let skip = (page - 1) * limit;
        
            // Xây dựng query filter
            let filter = {};
            if (req.query.category) {
                filter.category = req.query.category;
            }
        
            // Xây dựng query sort
            let sort = {};
            if (req.query._sort) {
                sort.price = parseInt(req.query._sort);
            } else {
                // Mặc định sắp xếp theo thời gian tạo mới nhất
                sort.createdAt = -1;
            }

            // Thực hiện các truy vấn song song
            const [products, totalProducts, categories] = await Promise.all([
                Product.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(), // Sử dụng lean() để tăng hiệu suất
                Product.countDocuments(filter),
                Category.find({}).distinct('name') // Lấy danh mục từ bảng Category thay vì từ Product
            ]);

            // Tính tổng số lượng cho mỗi sản phẩm
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

    // [GET] /admin/product/add
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

    // [POST] /admin/product/add
    async added(req, res, next) {
        try {
            const { name, description, category, price, image, sizes } = req.body;
            
            // Validate dữ liệu đầu vào
            if (!name || !description || !category || !price || !image) {
                return res.render('admin/addProduct', {
                    error: 'Vui lòng điền đầy đủ thông tin',
                    categories: await Category.find({}).lean(),
                    sizes: [38,39,40,41,42,43,44],
                    values: req.body
                });
            }

            // Kiểm tra sản phẩm đã tồn tại
            const existingProduct = await Product.findOne({ name });
            if (existingProduct) {
                return res.render('admin/addProduct', {
                    error: 'Sản phẩm này đã tồn tại',
                    categories: await Category.find({}).lean(),
                    sizes: [38,39,40,41,42,43,44],
                    values: req.body
                });
            }

            // Xử lý và validate sizes
            const formattedSizes = Array.isArray(sizes) ? sizes.map(size => ({
                size: parseInt(size.size),
                quantity: parseInt(size.quantity) || 0
            })).filter(size => !isNaN(size.size) && !isNaN(size.quantity)) : [];

            // Tạo slug từ tên sản phẩm
            const slug = slugify(name, { 
                lower: true, 
                locale: 'vi',
                strict: true
            });

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

    // [GET] /admin/product/edit/:id
    async edit(req, res, next) {
        try {
            const [product, categories] = await Promise.all([
                Product.findById(req.params.id).lean(),
                Category.find({}).lean()
            ]);

            if (!product) {
                return res.redirect('/admin/product');
            }

            res.render('admin/editProduct', {
                product,
                categories
            });
        } catch (err) {
            next(err);
    }
    }

    // [PUT] /admin/product/edit/:id
    async update(req, res, next) {
        try {
            const { name, description, category, price, image, supplier, sizes } = req.body;
            
            // Kiểm tra tên sản phẩm đã tồn tại (trừ sản phẩm hiện tại)
            const existingProduct = await Product.findOne({ 
                name, 
                _id: { $ne: req.params.id } 
            });
            
            if (existingProduct) {
                return res.render('admin/editProduct', {
                    error: 'Tên sản phẩm này đã tồn tại',
                    product: { ...req.body, _id: req.params.id },
                    categories: await Category.find({}).lean()
                });
            }

            // Xử lý và validate sizes
            const formattedSizes = sizes.map(size => ({
                size: parseInt(size.size),
                quantity: parseInt(size.quantity) || 0
            }));

            // Cập nhật slug nếu tên thay đổi
            const slug = slugify(name, { 
                lower: true, 
                locale: 'vi',
                strict: true
            });

            await Product.findByIdAndUpdate(req.params.id, {
                name,
                description,
                category,
                price: parseFloat(price),
                image,
                supplier,
                sizes: formattedSizes,
                slug
            });

            res.redirect('/admin/product');
        } catch (err) {
            console.error('Error in update:', err);
            res.render('admin/editProduct', {
                error: 'Có lỗi xảy ra khi cập nhật sản phẩm',
                product: { ...req.body, _id: req.params.id },
                categories: await Category.find({}).lean()
            });
        }
    }
}

module.exports = new ProductController;
