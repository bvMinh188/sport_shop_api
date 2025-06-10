const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { mongooseToObject, mutipleMongooseToObject } = require('../util/mongoose');

dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Map status tiếng Việt sang tiếng Anh
const STATUS_MAP = {
    'chờ xác nhận': 'pending',
    'đang giao hàng': 'shipping',
    'đã giao': 'delivered',
    'đã hủy': 'cancelled'
};

// Map status tiếng Anh sang tiếng Việt để hiển thị
const STATUS_MAP_VI = {
    'pending': 'Chờ xác nhận',
    'shipping': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
};

class OrderController {
    constructor() {
        // Bind methods to instance
        this.createOrder = this.createOrder.bind(this);
        this.getOrders = this.getOrders.bind(this);
        this.getOrderById = this.getOrderById.bind(this);
        this.updateOrderStatus = this.updateOrderStatus.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
    }

    // [POST] /api/orders
    async createOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const { address, paymentMethod } = req.body;

            if (!address) {
                    return res.status(400).json({
                        success: false,
                        message: 'Shipping address is required'
                    });
                }

            // Get cart and validate
            const cart = await Cart.findOne({ userId }).populate('items.product');
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Validate stock availability
            for (const item of cart.items) {
                const product = await Product.findById(item.product._id);
                const sizeObj = product.sizes.find(s => s.size === item.size);
                
                if (!sizeObj || sizeObj.quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${product.name} in size ${item.size}`
                    });
                }
            }

            // Calculate total amount
            const totalAmount = cart.items.reduce((sum, item) => {
                return sum + (item.product.price * item.quantity);
            }, 0);

            // Create order
            const order = new Order({
                userId,
                items: cart.items.map(item => ({
                    product: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    size: item.size,
                    image: item.product.image
                })),
                totalAmount,
                address,
                paymentMethod: paymentMethod || 'COD',
                status: 'pending'
            });

            await order.save();

            // Update product stock
            for (const item of cart.items) {
                await Product.updateOne(
                    { _id: item.product._id, 'sizes.size': item.size },
                    { $inc: { 'sizes.$.quantity': -item.quantity } }
            );
            }
            
            // Clear cart
            cart.items = [];
            await cart.save();
            
            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /api/orders
    async getOrders(req, res, next) {
        try {
            // Get user ID from authenticated request
            const userId = req.user._id;

            // Build query
            const query = { userId };
            if (req.query.status) {
                query.status = req.query.status;
            }

            // Get all orders for the user
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .lean();

            res.json({
                success: true,
                data: orders
            });
        } catch (error) {
            console.error('Error in getOrders:', error);
            next(error);
        }
    }

    // [GET] /api/orders/:id
    async getOrderById(req, res, next) {
        try {
            const userId = req.user.id;
            const orderId = req.params.id;

            const order = await Order.findOne({
                _id: orderId,
                userId
            }).lean();

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/orders/:id/status
    async updateOrderStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order status'
                });
            }

            const order = await Order.findById(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Only admin can update status
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update order status'
                });
            }

            order.status = status;
            await order.save();

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }

    // [PUT] /api/orders/:id/cancel
    async cancelOrder(req, res, next) {
        try {
            const userId = req.user.id;
            const orderId = req.params.id;

            const order = await Order.findOne({
                _id: orderId,
                userId
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
        }

            if (!['pending', 'processing'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Order cannot be cancelled'
                });
    }

            // Return stock to products
            for (const item of order.items) {
                await Product.updateOne(
                    { _id: item.product, 'sizes.size': item.size },
                    { $inc: { 'sizes.$.quantity': item.quantity } }
                );
            }

            order.status = 'cancelled';
            await order.save();

            res.json({
                success: true,
                message: 'Order cancelled successfully',
                data: { order }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController(); 