const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User')
const order = require('../models/Order')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
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
    
                // So sánh mật khẩu đã nhập với mật khẩu trong cơ sở dữ liệu
                bcrypt.compare(password, userByEmail.password)
                    .then(isMatch => {
                        if (isMatch) {
                            // Nếu mật khẩu đúng
                            const token = jwt.sign({ _id: userByEmail._id }, SECRET_CODE);
                            return res.json({ message: userByEmail.role, token: token });
                        } else {
                            // Nếu mật khẩu sai
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
        let productQuery = Product.find({});
        if (req.query.hasOwnProperty('_sort')){
            productQuery = productQuery.sort({
                price: req.query.price
            })
        }
        productQuery
            .then(products => {
                const categories = [...new Set(products.map(product => product.category))];

                res.render('admin/admin',{
                    categories: categories,
                    products: mutipleMongooseToObject(products),  
                });
            })
            .catch(next); 
    }


    //[Get] /:slug
    showProduct(req, res, next) {
        const slug = req.params.slug;
        Product.findOne({ slug: slug }).lean()
            .then((product) => {
                if (!product) {
                    console.error(`Không tìm thấy sản phẩm với slug: ${slug}`);
                    return res.status(404).render('errors/404', { message: "Không tìm thấy sản phẩm." });
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
                                        products: suggestedProducts
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
                                products: []
                            });
                        }
                    })
                    .catch((error) => {
                        console.error("Lỗi khi lấy dữ liệu sản phẩm gợi ý từ API:", error.message);
                        res.render('products/show', {
                            product: product,
                            products: []
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
    
        if (token) {
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
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
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
    
    
    
    
    
    
    
    
    
    //[DELETE] /delete-order/;id
    deleteOrder(req, res, next) {
        var token = req.cookies.token;
        const { size } = req.body;
        const id = req.params.id;
    
        if (token) {
            try {
                var decodeToken = jwt.verify(token, SECRET_CODE);
    
                Cart.findOneAndDelete(
                    { _id: id}
                )
                    .then(cartItem => {  
                        Product.updateOne(
                            { name: cartItem.name, 'sizes.size': size },
                            { $inc: { 'sizes.$.quantity': cartItem.quantity } }
                        ).then(() => {
                            res.json({ message: "Xóa thành công" });
                        }).catch(err => {
                            res.status(500).json({ message: "Lỗi khi cập nhật số lượng sản phẩm" });
                        });
                    })
                    .catch(next);
            } catch (err) {
                return res.status(403).json({ message: "Xác thực người dùng không thành công" });
            }
        } else {
            res.redirect('/login');
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
                            .then(order => {
                                res.render('user/profile', {
                                    userInfo: mongooseToObject(userInfo), // Truyền thông tin người dùng vào view
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
    checkout(req, res, next) {
        const { address, price } = req.body;
        const token = req.cookies?.token;
    
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                Cart.find({ userId: decodeToken._id })
                    .then(cartItems => {
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
                            address: address,
                            price: price,
                            status: 'chờ xác nhận',
                        });

                        newOrder.save()
                            .then(order => {
                                // Xóa giỏ hàng sau khi đặt hàng thành công
                                Cart.deleteMany({ userId: decodeToken._id })
                                    .then(() => {
                                        res.json({ message: 'success', order });
                                    })
                                    .catch(err => {
                                        console.error("Lỗi khi xóa giỏ hàng:", err);
                                        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa giỏ hàng' });
                                    });
                            })
                            .catch(err => {
                                console.error("Lỗi khi lưu đơn hàng:", err);
                                res.status(500).json({ message: 'Đã xảy ra lỗi khi lưu đơn hàng' });
                            });
                    })
                    .catch(err => {
                        console.error("Lỗi khi lấy giỏ hàng:", err);
                        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy giỏ hàng' });
                    });
            } catch (err) {
                console.error("Lỗi xác thực token:", err);
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    }
    
}

module.exports = new SiteController;
