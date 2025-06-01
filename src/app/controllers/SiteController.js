const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User')
const order = require('../models/Order')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../../util/mailjet');
dotenv.config()

const axios = require('axios');


const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose')
const { error } = require('console');
const { json } = require('express');
const Order = require('../models/Order');

class SiteController {
    //[post] /signup
    signUp(req, res, next) {
        const { email, password } = req.body; // Lấy email và password từ req.body
    
        User.findOne({ email: email })
            .then(userByEmail => {
                if (userByEmail) {
                    // Nếu email đã được đăng ký
                    return res.json({ message: 'email đã được đăng ký' });
                }
                // Mã hóa mật khẩu
                return bcrypt.hash(password, 10)
                    .then(hashedPassword => {
                        // Tạo người dùng mới với mật khẩu đã mã hóa
                        const user = new User({
                            ...req.body,
                            password: hashedPassword,
                        });
                        // Lưu người dùng vào cơ sở dữ liệu
                        return user.save();
                    })
                    .then(() => {
                        // Trả về phản hồi thành công
                        res.json({ message: "success" });
                    });
            })
            .catch(error => {
                // Xử lý lỗi nếu có bất kỳ lỗi nào xảy ra
                console.error("Lỗi khi đăng ký:", error);
                res.status(500).json({ message: "error" });
            });
    }
    

    //[Get] /register
    register(req,res,next){
        res.render('user/register')
    }

    //[Get] /login
    login(req,res,next){
        res.render('user/login')
    }
    
    //[post] /logined
    logined(req, res, next) {
        const { email, password } = req.body;

        User.findOne({ email: email })
            .then(userByEmail => {
                if (!userByEmail) {
                    return res.json({ message: 'tài khoản không tồn tại' });
                }

                bcrypt.compare(password, userByEmail.password)
                    .then(isMatch => {
                        if (isMatch) {
                            const token = jwt.sign({ _id: userByEmail._id }, SECRET_CODE);
                            
                            // Set cookie ở đây
                            res.cookie('token', token, {
                                httpOnly: true,
                                maxAge: 24 * 60 * 60 * 1000, // 1 ngày
                                sameSite: 'Lax',
                                secure: false // Chuyển thành true nếu dùng HTTPS
                            });

                            return res.json({ message: userByEmail.role }); // Không gửi token về client nữa
                        } else {
                            return res.json({ message: 'sai mật khẩu' });
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        return res.status(500).json({ message: 'đã xảy ra lỗi' });
                    });
            })
            .catch(error => {
                console.error(error);
                return res.status(500).json({ message: 'đã xảy ra lỗi' });
            });
    }


      
    //[Get] /
    index(req, res, next) {
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
            Product.distinct("category"),
            Product.find().sort({ sold: -1 }).limit(4) // Lấy top 4 sản phẩm bán chạy nhất
        ])
        .then(([products, totalProducts, categories, topProducts]) => {
            const totalPages = Math.ceil(totalProducts / limit);
    
            res.render('home', {
                categories: categories,
                products: mutipleMongooseToObject(products),
                topProducts: mutipleMongooseToObject(topProducts), // Truyền top products vào view
                currentPage: page,
                totalPages: totalPages,
                selectedCategory: req.query.category || null,
                _sort: req.query._sort || "",
            });
        })
        .catch(next);
    }


    //[Get] /:slug
    showProduct(req, res, next) {
        const slug = req.params.slug;
        const token = req.cookies.token;
        let userInfo = null;

        // Kiểm tra và lấy thông tin user nếu đã đăng nhập
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

        Promise.all([
            Product.findOne({ slug: slug }).lean(),
            getUserInfo
        ])
            .then(([product, user]) => {
                if (!product) {
                    console.error(`Không tìm thấy sản phẩm với slug: ${slug}`);
                    return res.status(404).render('errors/404', { 
                        message: "Không tìm thấy sản phẩm.",
                        user: user
                    });
                }
    
                const apiUrl = `http://localhost:5555/api?id=${product._id.toString()}`;
    
                // Gọi API để lấy sản phẩm gợi ý
                axios.get(apiUrl)
                    .then((response) => {
                        if (response.data && response.data['san pham goi y']) {
                            const suggestedIds = response.data['san pham goi y'];
                            Product.find({ _id: { $in: suggestedIds } })
                                .select('name image price slug')
                                .lean()
                                .then((suggestedProducts) => {
                                    res.render('products/show', {
                                        product: product,
                                        products: suggestedProducts,
                                        user: user // Truyền thông tin user vào view
                                    });
                                })
                                .catch((err) => {
                                    console.error("Lỗi khi truy vấn sản phẩm gợi ý:", err);
                                    next(err);
                                });
                        } else {
                            console.error("Dữ liệu sản phẩm gợi ý không hợp lệ:", response.data);
                            res.render('products/show', {
                                product: product,
                                products: [],
                                user: user // Truyền thông tin user vào view
                            });
                        }
                    })
                    .catch((error) => {
                        console.error("Lỗi khi lấy dữ liệu sản phẩm gợi ý từ API:", error.message);
                        res.render('products/show', {
                            product: product,
                            products: [],
                            user: user // Truyền thông tin user vào view
                        });
                    });
            })
            .catch((err) => {
                console.error("Lỗi khi truy vấn sản phẩm:", err);
                next(err);
            });
    }
    
    
    
    
    
    

    //[Post] /order/:id
    addProductCart(req, res, next) {
        const { quantity } = req.body;
        const size = parseInt(req.body.size, 10);
        const id = req.params.id;
        var token = req.cookies.token;
    
        if (!token) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng' });
        }

        try {
            var decodeToken = jwt.verify(token, SECRET_CODE);
            
            Product.findOne({ _id: id })
                .then(product => {
                    const sizeInfo = product.sizes.find(s => s.size === size);
                    if (!sizeInfo || sizeInfo.quantity < quantity) {
                        return res.status(400).json({ message: 'Sản phẩm không đủ số lượng' });
                    }
                    Cart.find({ userId: decodeToken._id })
                        .then(cartItems => {
                            const existingProduct = cartItems.find(item => item.name == product.name && item.size == size);
                            
                            if (existingProduct) {
                                Cart.findOneAndUpdate(
                                    { _id: existingProduct._id, size: size, userId: decodeToken._id },
                                    { $inc: { quantity: quantity } },
                                    { new: true }
                                )
                                .then(() => {
                                    return Product.updateOne(
                                        { _id: id, 'sizes.size': size },
                                        { $inc: { 'sizes.$.quantity': -quantity } }
                                    );
                                })
                                .then(() => res.json({ message: 'Cập nhật giỏ hàng thành công' }))
                                .catch(next);
                            }
                             else {
                                const newCart = new Cart({
                                    userId: decodeToken._id,
                                    name: product.name,
                                    image: product.image,
                                    price: product.price,
                                    category: product.category,
                                    size: size,
                                    quantity: quantity
                                });

                                newCart.save()
                                    .then(() => {
                                        return Product.updateOne(
                                            { _id: id, 'sizes.size': size },
                                            { $inc: { 'sizes.$.quantity': -quantity } }
                                        );
                                    })
                                    .then(() => res.json({ message: 'Thêm thành công' }))
                                    .catch(next);
                            }
                        })
                        .catch(next);
                })
                .catch(next);
        } catch (err) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng' });
        }
    }
    
    //[Get] /order
    showOrder(req, res, next) {
        const token = req.cookies.token;
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                User.findById(decodeToken._id)
                    .then(userInfo => {
                        if (!userInfo) {
                            return res.redirect('/login'); // Nếu không tìm thấy user, chuyển hướng về trang đăng nhập
                        }
                        Cart.find({ userId: decodeToken._id })
                            .then(cart => {
                                const array = cart.map(product => {
                                    return product.price * product.quantity
                                });
                                const tong = array.reduce((total, value) => total + value, 0);
                                res.render('user/order', {
                                    userInfo: mongooseToObject(userInfo), // Truyền thông tin người dùng vào view
                                    cart: mutipleMongooseToObject(cart),
                                    tong: tong
                                });
                            })
                            .catch(next);
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    }
    

    //[Post] /update-order/;id
    updateOrder(req, res, next) {
        const token = req.cookies.token;
        const { quantity } = req.body;
        const size = parseInt(req.body.size, 10);
        const id = req.params.id;
    
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
    
                // Tìm `cartItem` để lấy thông tin sản phẩm
                Cart.findOne({ _id: id})
                    .then(cartItem => {
                        const quantityDiff = quantity - cartItem.quantity
    
                        // Kiểm tra số lượng hiện có trong `Product`
                        Product.findOne({ name: cartItem.name, 'sizes.size': size })
                            .then(product => {
                                const sizeInfo = product.sizes.find(s => s.size === size);
                                if (!sizeInfo || sizeInfo.quantity < quantityDiff) {
                                    return res.status(400).json({ message: 'Sản phẩm không đủ số lượng' });
                                }
                                // Cập nhật `Cart` và `Product`
                                Cart.findOneAndUpdate(
                                    { _id: id},
                                    { $set: { quantity: quantity } },
                                    { new: true }
                                )
                                .then(() => {
                                    return Product.updateOne(
                                        { _id: id, 'sizes.size': size },
                                        { $inc: { 'sizes.$.quantity': -quantityDiff } }
                                    );
                                })
                                .then(() => res.json({ message: 'Cập nhật giỏ hàng thành công' }))
                                .catch(next);
                            })
                            .catch(err => {
                                console.error("Lỗi khi kiểm tra số lượng sản phẩm:", err);
                                res.status(500).json({ message: "Lỗi khi kiểm tra số lượng sản phẩm" });
                            });
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    }
    
    
    
    
    
    
    
    
    
    //[DELETE] /delete-cart/:id - Xóa sản phẩm khỏi giỏ hàng
    async deleteCartItem(req, res, next) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.redirect('/login');
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const cartId = req.params.id;
            const size = parseInt(req.query.size, 10); // Lấy size từ query parameter

            // Tìm sản phẩm trong giỏ hàng
            const cartItem = await Cart.findOne({ 
                _id: cartId,
                userId: decodeToken._id,
                size: size
            });
    
            if (!cartItem) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            // Kiểm tra sản phẩm có tồn tại trong collection Product
            const product = await Product.findOne({ 
                name: cartItem.name,
                'sizes.size': cartItem.size 
            });

            if (!product) {
                // Nếu không tìm thấy sản phẩm, vẫn xóa khỏi giỏ hàng nhưng log lỗi
                console.error(`Không tìm thấy sản phẩm ${cartItem.name} với size ${cartItem.size} trong kho`);
                await Cart.findByIdAndDelete(cartId);
                return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
            }

            // Tìm size info của sản phẩm
            const sizeInfo = product.sizes.find(s => s.size === size);
            if (!sizeInfo) {
                console.error(`Không tìm thấy thông tin size ${size} của sản phẩm ${cartItem.name}`);
                await Cart.findByIdAndDelete(cartId);
                return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
            }

            // Cập nhật lại số lượng trong kho
            await Product.updateOne(
                { name: cartItem.name, 'sizes.size': cartItem.size },
                            { $inc: { 'sizes.$.quantity': cartItem.quantity } }
            );

            // Xóa sản phẩm khỏi giỏ hàng
            await Cart.findByIdAndDelete(cartId);

            res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
        } catch (err) {
            console.error('Lỗi khi xóa sản phẩm:', err);
            if (err.name === 'JsonWebTokenError') {
                return res.redirect('/login');
            }
            res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa sản phẩm' });
        }
    }

    //[DELETE] /cancel-order/:id - Hủy đơn hàng
    async cancelOrder(req, res, next) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.redirect('/login');
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const orderId = req.params.id;

            // Tìm đơn hàng và kiểm tra trạng thái
            const order = await Order.findOne({
                _id: orderId,
                userId: decodeToken._id
            });

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Kiểm tra trạng thái đơn hàng
            const allowedStatusToCancel = ['chờ xác nhận', 'đã xác nhận', 'đang giao hàng'];
            if (!allowedStatusToCancel.includes(order.status)) {
                return res.status(400).json({ 
                    message: 'Không thể hủy đơn hàng này do trạng thái không phù hợp',
                    currentStatus: order.status
                });
            }

            // Cập nhật trạng thái đơn hàng thành "đã hủy"
            order.status = 'đã hủy';
            await order.save();

            // Hoàn lại số lượng sản phẩm vào kho và cập nhật số lượng đã bán
            const updatePromises = order.products.map(product => {
                return Promise.all([
                    // Cập nhật số lượng trong kho
                    Product.updateOne(
                        { name: product.name, 'sizes.size': product.size },
                        { $inc: { 'sizes.$.quantity': product.quantity } }
                    ),
                    // Giảm số lượng đã bán
                    Product.updateOne(
                        { name: product.name },
                        { $inc: { sold: -product.quantity } }
                    )
                ]);
            });

            await Promise.all(updatePromises.flat());

            res.json({ message: 'Hủy đơn hàng thành công' });
            } catch (err) {
            console.error('Lỗi khi hủy đơn hàng:', err);
            if (err.name === 'JsonWebTokenError') {
                return res.redirect('/login');
            }
            res.status(500).json({ message: 'Đã xảy ra lỗi khi hủy đơn hàng' });
        }
    }
    

    //[Get] /profile
    profile(req, res, next) {
        const token = req.cookies.token;
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                User.findById(decodeToken._id)
                    .then(userInfo => {
                        if (!userInfo) {
                            return res.redirect('/login'); 
                        }
                        Order.find({ userId: decodeToken._id })
                            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần (mới nhất lên đầu)
                            .then(order => {
                                res.render('user/profile', {
                                    userInfo: mongooseToObject(userInfo),
                                    order: mutipleMongooseToObject(order)
                                });
                            })
                            .catch(next);
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    }

    //[Post] /checkout
    async checkout(req, res, next) {
        const { address, price } = req.body;
        const token = req.cookies?.token;
    
        if (!token) {
            return res.redirect('/login');
        }

            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
            
            // If no address provided, try to get default address
            if (!address) {
                const user = await User.findById(decodeToken._id);
                const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
                if (!defaultAddress) {
                    return res.status(400).json({ message: 'Vui lòng chọn địa chỉ giao hàng' });
                }
                req.body.address = defaultAddress.address;
            }

            const cartItems = await Cart.find({ userId: decodeToken._id });
            if (!cartItems.length) {
                return res.status(400).json({ message: 'Giỏ hàng trống' });
            }

                        const products = cartItems.map(item => ({
                            name: item.name,
                            image: item.image,
                            size: item.size,
                            quantity: item.quantity
                        }));
    
                        // Tạo một đơn hàng mới
                        const newOrder = new Order({
                            userId: decodeToken._id,
                            products: products,
                address: req.body.address,
                            price: price,
                            status: 'chờ xác nhận',
                        });

            // Cập nhật số lượng đã bán cho từng sản phẩm
            const updateSoldPromises = cartItems.map(item => {
                return Product.findOneAndUpdate(
                    { name: item.name },
                    { $inc: { sold: item.quantity } }
                );
            });

            const [order] = await Promise.all([newOrder.save(), ...updateSoldPromises]);
            
                                // Xóa giỏ hàng sau khi đặt hàng thành công
            await Cart.deleteMany({ userId: decodeToken._id });
            
                                        res.json({ message: 'success', order });
        } catch (err) {
            console.error("Lỗi trong quá trình checkout:", err);
            if (err.name === 'JsonWebTokenError') {
                return res.redirect('/login');
            }
            res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình đặt hàng' });
        }
    }
    
    //[Post] /add-address
    async addAddress(req, res, next) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const { name, address, isDefault } = req.body;

            // Validate input
            if (!name || !address) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng nhập đầy đủ thông tin địa chỉ' 
                });
            }

            // Log để debug
            console.log('Received data:', { name, address, isDefault });

            const user = await User.findById(decodeToken._id);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Không tìm thấy người dùng' 
                });
            }

            // Nếu địa chỉ mới được đặt làm mặc định, bỏ mặc định của các địa chỉ khác
            if (isDefault) {
                user.addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }

            // Thêm địa chỉ mới
            user.addresses.push({
                name,
                address,
                isDefault: isDefault || user.addresses.length === 0 // Nếu là địa chỉ đầu tiên, đặt làm mặc định
            });

            await user.save();

            // Log để debug
            console.log('Updated user:', user);

            res.json({ 
                success: true, 
                message: 'Thêm địa chỉ thành công',
                address: user.addresses[user.addresses.length - 1] // Trả về địa chỉ vừa thêm
            });
        } catch (err) {
            console.error('Error in addAddress:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Có lỗi xảy ra khi thêm địa chỉ',
                error: err.message 
            });
        }
    }

    //[Post] /set-default-address
    async setDefaultAddress(req, res) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const { addressId } = req.body;

            const user = await User.findById(decodeToken._id);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Không tìm thấy người dùng' 
                });
            }

            // Validate addressId
            if (addressId < 0 || addressId >= user.addresses.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Địa chỉ không hợp lệ'
                });
            }

            // Remove default from all addresses
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });

            // Set new default address
            user.addresses[addressId].isDefault = true;

            await user.save();

            res.json({ 
                success: true, 
                message: 'Đã cập nhật địa chỉ mặc định'
                    });
            } catch (err) {
            console.error('Error in setDefaultAddress:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Có lỗi xảy ra khi cập nhật địa chỉ mặc định',
                error: err.message 
            });
        }
    }

    // [GET] /search
    async search(req, res) {
        try {
            const searchQuery = req.query.q || '';
            
            if (!searchQuery.trim()) {
                return res.redirect('/');
            }

            // Create a case-insensitive search regex
            const searchRegex = new RegExp(searchQuery.trim(), 'i');

            // Search in multiple fields
            const products = await Product.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { category: searchRegex }
                ]
            }).lean();

            res.render('products/search', {
                products,
                searchQuery,
                title: `Kết quả tìm kiếm cho "${searchQuery}"`,
                user: res.locals.user // Use the user data from res.locals
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).render('error', {
                message: 'Đã xảy ra lỗi trong quá trình tìm kiếm',
                user: res.locals.user
            });
        }
    }

    //[GET] /forgot-password
    forgotPassword(req, res) {
        res.render('user/forgot-password');
    }

    //[POST] /forgot-password
    async handleForgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Email không tồn tại trong hệ thống'
                });
            }

            // Tạo token ngẫu nhiên
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Lưu token và thời gian hết hạn (1 giờ)
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
            await user.save();

            // Gửi email
            await sendPasswordResetEmail(email, resetToken);

            res.json({
                success: true,
                message: 'Link đặt lại mật khẩu đã được gửi vào email của bạn'
            });
        } catch (error) {
            console.error('Lỗi khi xử lý quên mật khẩu:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
            });
        }
    }

    //[GET] /reset-password/:token
    async showResetPassword(req, res) {
        try {
            const { token } = req.params;
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.render('error', {
                    message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
                });
            }

            res.render('user/reset-password', { token });
        } catch (error) {
            console.error('Lỗi khi hiển thị trang đặt lại mật khẩu:', error);
            res.render('error', {
                message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
            });
            }
    }

    //[POST] /reset-password
    async handleResetPassword(req, res) {
        try {
            const { token, password } = req.body;
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
                });
            }

            // Mã hóa mật khẩu mới
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Cập nhật mật khẩu và xóa token
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Đặt lại mật khẩu thành công'
            });
        } catch (error) {
            console.error('Lỗi khi đặt lại mật khẩu:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi đặt lại mật khẩu'
            });
        }
    }

    // [POST] /account/updateprofile
    async updateProfile(req, res) {
        try {
            const { username, email, phone } = req.body;
            const token = req.cookies.token;
            
            if (!token) {
                return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const userId = decodeToken._id;

            // Update user information
            await User.findByIdAndUpdate(userId, {
                username,
                email,
                phone
            });

            res.json({ success: true, message: 'Cập nhật thông tin thành công' });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật thông tin' });
        }
    }
}

module.exports = new SiteController;
