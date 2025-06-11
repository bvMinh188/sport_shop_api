const Cart = require('../models/Cart');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
const { mongooseToObject, mutipleMongooseToObject } = require('../util/mongoose');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

class CartController {
    constructor() {
        // Bind methods to instance
        this.getCart = this.getCart.bind(this);
        this.addToCart = this.addToCart.bind(this);
        this.updateCartItem = this.updateCartItem.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.clearCart = this.clearCart.bind(this);
    }

    // [GET] /api/cart
    async getCart(req, res, next) {
        try {
            
            const userId = req.user.id;
            let cart = await Cart.findOne({ userId }).populate('items.product');

            if (!cart) {
                cart = await Cart.create({ userId, items: [] });
            }

            res.json({
                success: true,
                data: { cart }
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /api/cart/add
    async addToCart(req, res, next) {
        try {
            // 1. Kiểm tra user đăng nhập
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    success: false,
                    message: 'Missing token'
                });
            }

            // 2. Lấy thông tin từ request
            const { productId, size, quantity } = req.body;

            // 3. Validate dữ liệu đầu vào
            if (!productId || !size || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // 4. Kiểm tra sản phẩm tồn tại và còn hàng
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // 5. Kiểm tra size và số lượng tồn kho
            const sizeObj = product.sizes.find(s => s.size === parseInt(size));
            if (!sizeObj) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid size'
                });
            }

            // 6. Tìm giỏ hàng hiện tại của user
            let existingCartItem = await Cart.findOne({
                userId: req.user._id,
                'product': productId,
                'size': parseInt(size)
            });

            if (existingCartItem) {
                // 7a. Nếu sản phẩm đã tồn tại trong giỏ hàng
                const totalQuantity = existingCartItem.quantity + quantity;
                
                // Kiểm tra tổng số lượng mới không vượt quá tồn kho
                if (totalQuantity > sizeObj.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient stock'
                    });
                }

                // Cập nhật số lượng trong giỏ hàng
                existingCartItem = await Cart.findOneAndUpdate(
                    { _id: existingCartItem._id },
                    { quantity: totalQuantity },
                    { new: true }
                ).populate('product');

                return res.json({
                    success: true,
                    message: 'Item added to cart successfully',
                    data: { cart: existingCartItem }
                });

            } else {
                // 7b. Nếu sản phẩm chưa có trong giỏ hàng
                if (quantity > sizeObj.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient stock'
                    });
                }

                // Tạo cart item mới
                const newCart = new Cart({
                    userId: req.user._id,
                    product: productId,
                    size: parseInt(size),
                    quantity: quantity
                });

                // Lưu cart
                await newCart.save();
                
                // Populate product information
                const savedCart = await Cart.findById(newCart._id).populate('product');

                return res.json({
                    success: true,
                    message: 'Item added to cart successfully',
                    data: { cart: savedCart }
                });
            }

        } catch (error) {
            console.error('Add to cart error:', error);
            next(error);
        }
    }

    // [PUT] /api/cart/update/:itemId
    async updateCartItem(req, res, next) {
        try {
            const userId = req.user.id;
            const { itemId } = req.params;
            const { quantity } = req.body;

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid quantity'
                });
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            const cartItem = cart.items.id(itemId);
            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            // Check stock availability
            const product = await Product.findById(cartItem.product);
            const sizeObj = product.sizes.find(s => s.size === cartItem.size);
            if (!sizeObj || sizeObj.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }

            cartItem.quantity = quantity;
            await cart.save();
            cart = await cart.populate('items.product');

            res.json({
                success: true,
                message: 'Cart item updated successfully',
                data: { cart }
            });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /api/cart/remove/:itemId
    async removeFromCart(req, res, next) {
        try {
            const userId = req.user.id;
            const { itemId } = req.params;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            cart.items = cart.items.filter(item => item._id.toString() !== itemId);
            await cart.save();
            cart = await cart.populate('items.product');

            res.json({
                success: true,
                message: 'Item removed from cart successfully',
                data: { cart }
            });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /api/cart/clear
    async clearCart(req, res, next) {
        try {
            const userId = req.user.id;

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            cart.items = [];
            await cart.save();

            res.json({
                success: true,
                message: 'Cart cleared successfully',
                data: { cart }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CartController(); 