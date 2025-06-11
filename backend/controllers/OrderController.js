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
    'đã giao hàng': 'delivered',
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
            const userId = req.user._id;
            const { address } = req.body;

            // Kiểm tra user tồn tại
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // 1. Kiểm tra và lấy địa chỉ mặc định nếu không có địa chỉ
            if (!address) {
                const user = await User.findById(userId);
                const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
                if (!defaultAddress) {
                    return res.status(400).json({
                        success: false,
                        message: 'Vui lòng chọn địa chỉ giao hàng'
                    });
                }
                req.body.address = defaultAddress.address;
            }

            // 2. Kiểm tra giỏ hàng
            const cartItems = await Cart.find({ userId }).populate('product');
            if (!cartItems.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Giỏ hàng trống'
                });
            }

            // 3. Kiểm tra tồn kho cho tất cả sản phẩm
            for (const item of cartItems) {
                const product = item.product;
                const sizeObj = product.sizes.find(s => s.size === item.size);
                
                if (!sizeObj || sizeObj.quantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Không đủ hàng cho sản phẩm ${product.name} size ${item.size}`
                    });
                }
            }

            // 4. Tính tổng tiền và chuẩn bị dữ liệu sản phẩm
            const totalAmount = cartItems.reduce((sum, item) => {
                return sum + (item.product.price * item.quantity);
            }, 0);

            // 5. Chuẩn bị dữ liệu sản phẩm cho đơn hàng
            const products = cartItems.map(item => ({
                name: item.product.name,
                image: item.product.image,
                price: item.product.price.toString(),
                size: item.size,
                quantity: item.quantity
            }));

            // 6. Tạo đơn hàng mới
            const order = new Order({
                userId,
                name: req.body.name,
                phone: req.body.phone,
                products: products,
                price: totalAmount.toString(), // Chuyển sang string theo yêu cầu của schema
                address: req.body.address,
                status: 'chờ xác nhận' // Sử dụng giá trị enum tiếng Việt theo schema
            });

            await order.save();

            // 7. Cập nhật số lượng tồn kho
            const updateStockPromises = cartItems.map(item => {
                return Product.updateOne(
                    { _id: item.product._id, 'sizes.size': item.size },
                    { $inc: { 'sizes.$.quantity': -item.quantity } }
                );
            });

            await Promise.all(updateStockPromises);

            // 8. Xóa giỏ hàng
            await Cart.deleteMany({ userId });

            res.status(201).json({
                success: true,
                message: 'Đặt hàng thành công',
                data: { order }
            });
        } catch (error) {
            console.error('Lỗi trong quá trình tạo đơn hàng:', error);
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
            const userId = req.user._id;
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

            if (order.status !== 'chờ xác nhận') {
                return res.status(400).json({
                    success: false,
                    message: 'Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xác nhận'
                });
            }

            // Return stock to products
            for (const product of order.products) {
                await Product.updateOne(
                    { _id: product.product, 'sizes.size': product.size },
                    { $inc: { 'sizes.$.quantity': product.quantity } }
                );
            }

            order.status = 'đã hủy';
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