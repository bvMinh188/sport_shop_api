const Cart = require('../models/Cart');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');

class CartController {
    // [POST] /add/:id
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
                            } else {
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
    
    // [GET] /show
    showCart(req, res, next) {
        const token = req.cookies.token;
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                Promise.all([
                    Cart.find({ userId: decodeToken._id }),
                    User.findById(decodeToken._id)
                ])
                    .then(([cart, user]) => {
                        const array = cart.map(product => {
                            return product.price * product.quantity
                        });
                        const tong = array.reduce((total, value) => total + value, 0);
                        res.render('user/order', {
                            cart: mutipleMongooseToObject(cart),
                            tong: tong,
                            userInfo: mongooseToObject(user)
                        });
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/auth/login');
            }
        } else {
            res.redirect('/auth/login');
        }
    }

    // [POST] /update/:id
    updateCart(req, res, next) {
        const token = req.cookies.token;
        const { quantity } = req.body;
        const size = parseInt(req.body.size, 10);
        const id = req.params.id;
    
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
    
                Cart.findOne({ _id: id})
                    .then(cartItem => {
                        const quantityDiff = quantity - cartItem.quantity
    
                        Product.findOne({ name: cartItem.name, 'sizes.size': size })
                            .then(product => {
                                const sizeInfo = product.sizes.find(s => s.size === size);
                                if (!sizeInfo || sizeInfo.quantity < quantityDiff) {
                                    return res.status(400).json({ message: 'Sản phẩm không đủ số lượng' });
                                }
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
                res.redirect('/auth/login');
            }
        } else {
            res.redirect('/auth/login');
        }
    }
    
    // [DELETE] /delete/:id
    async deleteCartItem(req, res, next) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.redirect('/auth/login');
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const cartId = req.params.id;
            const size = parseInt(req.query.size, 10);

            const cartItem = await Cart.findOne({ 
                _id: cartId,
                userId: decodeToken._id,
                size: size
            });
    
            if (!cartItem) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }

            const product = await Product.findOne({ 
                name: cartItem.name,
                'sizes.size': cartItem.size 
            });

            if (!product) {
                console.error(`Không tìm thấy sản phẩm ${cartItem.name} với size ${cartItem.size} trong kho`);
                await Cart.findByIdAndDelete(cartId);
                return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
            }

            const sizeInfo = product.sizes.find(s => s.size === size);
            if (!sizeInfo) {
                console.error(`Không tìm thấy thông tin size ${size} của sản phẩm ${cartItem.name}`);
                await Cart.findByIdAndDelete(cartId);
                return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
            }

            await Product.updateOne(
                { name: cartItem.name, 'sizes.size': cartItem.size },
                { $inc: { 'sizes.$.quantity': cartItem.quantity } }
            );

            await Cart.findByIdAndDelete(cartId);

            res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
        } catch (err) {
            console.error('Lỗi khi xóa sản phẩm:', err);
            if (err.name === 'JsonWebTokenError') {
                return res.redirect('/auth/login');
            }
            res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa sản phẩm' });
        }
    }

    // [POST] /checkout
    async checkout(req, res, next) {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để thanh toán' });
        }

        try {
            const decodeToken = jwt.verify(token, SECRET_CODE);
            const cartItems = await Cart.find({ userId: decodeToken._id });
            
            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ message: 'Giỏ hàng trống' });
            }

            const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const orderData = {
                userId: decodeToken._id,
                products: cartItems.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size
                })),
                price: totalPrice,
                address: req.body.address
            };

            // Xóa giỏ hàng sau khi đặt hàng thành công
            await Cart.deleteMany({ userId: decodeToken._id });

            res.json({ 
                success: true, 
                message: 'Đặt hàng thành công',
                orderId: orderData._id 
            });
        } catch (err) {
            console.error('Checkout error:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Có lỗi xảy ra khi đặt hàng' 
            });
        }
    }
}

module.exports = new CartController(); 