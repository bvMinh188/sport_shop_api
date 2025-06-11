const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');

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
    // [POST] /checkout
    async checkout(req, res, next) {
        const { address, price } = req.body;
        const token = req.cookies?.token;
    
        if (!token) {
            return res.redirect('/auth/login');
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

            // Validate và chuẩn bị dữ liệu sản phẩm
            const products = cartItems.map(item => ({
                name: item.name,
                image: item.image,
                price: item.price.toString(),
                size: item.size,
                quantity: item.quantity
            }));

            // Tạo đơn hàng mới
            const order = new Order({
                userId: decodeToken._id,
                products: products,
                price: price.toString(),
                address: req.body.address,
                status: 'chờ xác nhận'
            });

            await order.save();

            // Cập nhật số lượng đã bán cho từng sản phẩm
            const updateSoldPromises = cartItems.map(item => {
                return Product.findOneAndUpdate(
                    { name: item.name },
                    { $inc: { sold: item.quantity } }
                );
            });

            await Promise.all(updateSoldPromises);
            
            // Xóa giỏ hàng sau khi đặt hàng thành công
            await Cart.deleteMany({ userId: decodeToken._id });
            
            res.json({ message: 'success', order });
        } catch (err) {
            console.error("Lỗi trong quá trình checkout:", err);
            if (err.name === 'JsonWebTokenError') {
                return res.redirect('/auth/login');
            }
            res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình đặt hàng' });
        }
    }

    // [DELETE] /cancel/:id
    async cancelOrder(req, res, next) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.redirect('/auth/login');
            }

            const decodeToken = jwt.verify(token, SECRET_CODE);
            const orderId = req.params.id;

            // Tìm đơn hàng
            const order = await Order.findOne({
                _id: orderId,
                userId: decodeToken._id
            });

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Sử dụng State Pattern để hủy đơn hàng
            const success = await order.cancelOrder();
            if (!success) {
                return res.status(400).json({ 
                    message: 'Không thể hủy đơn hàng này do trạng thái không phù hợp',
                    currentStatus: order.status
                });
            }

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
                return res.redirect('/auth/login');
            }
            res.status(500).json({ message: 'Đã xảy ra lỗi khi hủy đơn hàng' });
        }
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
}

module.exports = new OrderController(); 