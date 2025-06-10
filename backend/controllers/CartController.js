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
            const userId = req.user.id;
            const { productId, size, quantity } = req.body;

            if (!productId || !size || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Check product exists and has stock
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            const sizeObj = product.sizes.find(s => s.size === parseInt(size));
            if (!sizeObj || sizeObj.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Product size not available or insufficient stock'
                });
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = await Cart.create({ userId, items: [] });
            }

            // Check if product with same size exists in cart
            const existingItem = cart.items.find(
                item => item.product.toString() === productId && item.size === parseInt(size)
            );

            if (existingItem) {
                // Update quantity if total doesn't exceed stock
                if (existingItem.quantity + quantity > sizeObj.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot add more items than available in stock'
                    });
                }
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    product: productId,
                    size: parseInt(size),
                    quantity: quantity
                });
            }

            await cart.save();
            cart = await cart.populate('items.product');

            res.json({
                success: true,
                message: 'Item added to cart successfully',
                data: { cart }
            });
        } catch (error) {
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
module.exports = new CartController(); 