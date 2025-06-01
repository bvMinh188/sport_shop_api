const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');


class AdminController{
    //[GET] /admin/home
    async home(req, res, next) {
        try {
            const totalCategories = await Category.countDocuments();
            const totalProducts = await Product.countDocuments();
            const totalOrders = await Order.countDocuments();
            const totalUsers = await User.countDocuments();

            res.render('admin/home', {
                totalCategories,
                totalProducts,
                totalOrders,
                totalUsers,
                isHome: true
            });
        } catch (err) {
            next(err);
        }
    }

    //[Get] /admin
    storedProducts(req, res, next) {
            let page = parseInt(req.query.page) || 1;
            let limit = 12;
            let skip = (page - 1) * limit;
        
            let filter = {};
            if (req.query.category) {
                filter.category = req.query.category;
            }
        
            let productQuery = Product.find(filter);
        
            if (req.query._sort) {
                productQuery = productQuery.sort({ price: req.query._sort });
            }
        
            Promise.all([
                productQuery.skip(skip).limit(limit),
                Product.countDocuments(filter),
                Product.distinct("category")
            ])
            .then(([products, totalProducts, categories]) => {
                const totalPages = Math.ceil(totalProducts / limit);
        
                res.render('admin/admin', {
                    categories: categories,
                    products: mutipleMongooseToObject(products),
                    currentPage: page,
                    totalPages: totalPages,
                    selectedCategory: req.query.category || null,
                    _sort: req.query._sort || "",
                });
            })
            .catch(next);
        }

    //[Get] /admin/product
    async productList(req, res, next) {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 12;
            let skip = (page - 1) * limit;
        
            let filter = {};
            if (req.query.category) {
                filter.category = req.query.category;
            }
        
            let productQuery = Product.find(filter);
        
            if (req.query._sort) {
                productQuery = productQuery.sort({ price: req.query._sort });
            }

            const [products, totalProducts, categories] = await Promise.all([
                productQuery.skip(skip).limit(limit),
                Product.countDocuments(filter),
                Product.distinct("category")
            ]);

            // Tính tổng số lượng cho mỗi sản phẩm
            const productsWithTotalQuantity = products.map(product => {
                const totalQuantity = product.sizes.reduce((sum, size) => sum + size.quantity, 0);
                return {
                    ...product.toObject(),
                    totalQuantity
                };
            });

            const totalPages = Math.ceil(totalProducts / limit);
    
            res.render('admin/product', {
                categories: categories,
                products: productsWithTotalQuantity,
                currentPage: page,
                totalPages: totalPages,
                selectedCategory: req.query.category || null,
                _sort: req.query._sort || "",
            });
        } catch (err) {
            next(err);
        }
    }

    //[Get] /admin/addProduct
    addProduct(req, res, next) {
        Category.find({})
            .then(categories => {
                const sizes = [38,39,40,41,42,43,44]
                res.render('admin/addProduct', { 
                    sizes : sizes,
                    categories: mutipleMongooseToObject(categories) // Chuyển danh sách categories thành đối tượng bình thường
                });
            })
            .catch(next);
    }

    //[POST] /admin/added
    added(req, res, next) {
        const product = new Product(req.body)
    
        product.save()
            .then(() => {
                res.redirect('/admin');

            })
            .catch(next);
    }

    //[Get] /admin/addCategory
    addCategory(req, res, next) {
        res.render('admin/addCategory');
    }

    //[POST] /admin/category/add
    async addedCategory(req, res, next) {
        try {
            const category = new Category({
                name: req.body.name,
                description: req.body.description
            });
            await category.save();
            res.redirect('/admin/category');
        } catch (err) {
            next(err);
        }
    }

    //[GET] /admin/category/edit/:id
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

    //[PUT] /admin/category/edit/:id
    async updateCategory(req, res, next) {
        try {
            await Category.findByIdAndUpdate(req.params.id, {
                name: req.body.name,
                description: req.body.description
            });
            res.redirect('/admin/category');
        } catch (err) {
            next(err);
        }
    }

    show(req, res, next){
        Product.findOne({ slug: req.params.slug })
            .then(product => {
                
                res.render('products/show', { product : mongooseToObject(product) });
            })
            .catch(next);
    }

    //[Get] /admin/:id/edit
    edit(req, res, next) {
        Product.findById(req.params.id)
            .then(product => {
                res.render('admin/edit', {
                    product: mongooseToObject(product)
                });
            })
            .catch(next); 
    }

    //[PUT] /admin/;id
    update(req, res, next){
        Product.updateOne({_id: req.params.id}, req.body)
            .then(() => res.redirect('/admin'))
            .catch(next);
    }
    //[DELELTE] /admin/:id
    delete(req, res, next) {
        Product.delete({ _id: req.params.id }) // xóa mềm
            .then(() => {
                res.redirect('back');
            })
            .catch(next);
    }

    //[Get] /admin/users
    async showUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10; // số người dùng mỗi trang
            const skip = (page - 1) * limit;

            // Đếm tổng số người dùng
            const totalUsers = await User.countDocuments({});
            const totalPages = Math.ceil(totalUsers / limit);

            const users = await User.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            res.render('admin/userInfo', {
                user: mutipleMongooseToObject(users),
                currentPage: page,
                totalPages: totalPages
            });
        } catch (err) {
            next(err);
        }
    }

    //[Get] /admin/users/:id/edit
    showUsersEdit(req, res, next){
        User.findOne({_id: req.params.id})
            .then(user => {
                
                res.render('admin/userInfoEdit', { user : mongooseToObject(user) });
            })
            .catch(next);
    }
    
    //[Get] /admin/users/:id/delete
    showUsersDelete(req, res, next){
        User.findOne({_id: req.params.id})
            .then(user => {
                
                res.render('admin/userInfoDelete', { user : mongooseToObject(user) });
            })
            .catch(next);
    }

    //[PUT] /admin/users/:id/edited
    showUsersEdited(req, res, next){
        User.updateOne({_id: req.params.id}, req.body)
            .then(() => res.redirect('/admin/users'))
            .catch(next);
    } 

    //[DELELTE] /admin/:id
    showUsersDeleted(req, res, next) {
        User.delete({ _id: req.params.id }) // xóa mềm
            .then(() => {
                res.redirect('/admin/users');
            })
            .catch(next);
    }


    //[GET] /admin/transaction
    async transaction(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10; // số đơn hàng mỗi trang
            const skip = (page - 1) * limit;

            // Đếm tổng số đơn hàng
            const totalOrders = await Order.countDocuments({});
            const totalPages = Math.ceil(totalOrders / limit);

            const orders = await Order.find({})
                .populate('userId', 'username email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const formattedOrders = orders.map((order, index) => ({
                ...order.toObject(),
                stt: skip + index + 1, // Cập nhật STT dựa trên trang hiện tại
                customerName: order.userId ? order.userId.username : 'N/A',
                phone: order.userId ? order.userId.phone : 'N/A',
                address: order.address || 'N/A',
                price: order.price ? order.price.toLocaleString('vi-VN') : '0',
                createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'
            }));

            res.render('admin/transaction', {
                orders: formattedOrders,
                currentPage: page,
                totalPages: totalPages
            });
        } catch (err) {
            console.error('Error in transaction:', err);
            next(err);
        }
    }

    //[GET] /admin/transaction/:id/detail
    async getOrderDetail(req, res, next) {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }
            res.json(order);
        } catch (err) {
            next(err);
        }
    }

    //[PATCH] /admin/transaction/:id/confirm
    async confirmOrder(req, res, next) {
        try {
            await Order.findByIdAndUpdate(
                req.params.id,
                { status: 'đang giao' },
                { new: true }
            );
            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }

    //[PATCH] /admin/transaction/:id/complete
    async completeOrder(req, res, next) {
        try {
            await Order.findByIdAndUpdate(
                req.params.id,
                { status: 'đã giao' },
                { new: true }
            );
            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }

    //[DELETE] /admin/transaction/:id
    async deleteOrder(req, res, next) {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Hoàn lại số lượng sản phẩm vào kho
            for (const product of order.products) {
                await Product.updateOne(
                    { name: product.name, 'sizes.size': product.size },
                    { $inc: { 'sizes.$.quantity': product.quantity } }
                );
            }

            await Order.findByIdAndUpdate(req.params.id, { status: 'đã hủy' });
            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }

    //[GET] /admin/category
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

    //[DELETE] /admin/category/:id
    async deleteCategory(req, res, next) {
        try {
            await Category.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
}
   


module.exports = new AdminController;
