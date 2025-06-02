const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const OrderFactory = require('../factories/OrderFactory');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');

dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Map status tiếng Việt sang tiếng Anh
const STATUS_MAP = {
    'chờ xác nhận': 'pending',
    'đang giao': 'shipping',
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

            const orderData = {
                userId: decodeToken._id,
                products: cartItems.map(item => ({
                    name: item.name,
                    image: item.image,
                    price: item.price.toString(),
                    size: item.size,
                    quantity: item.quantity
                })),
                price: price.toString(),
                address: req.body.address
            };

            // Sử dụng OrderFactory để tạo đơn hàng mới
            const order = await OrderFactory.createOrder(orderData);

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

    // [GET] /admin/transaction
    async transaction(req, res, next) {
        try {
            const orders = await Order.find().populate("userId", "username phone");
            res.render('admin/transaction', { 
                order: mutipleMongooseToObject(orders)
            });
        } catch (err) {
            next(err);
        }
    }

    // [PATCH] /admin/transaction/cancel/:id
    async adminCancelOrder(req, res, next) {
        try {
            const order = await Order.findById(req.params.id);
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

            // Cập nhật lại số lượng tồn kho cho từng sản phẩm trong đơn hàng
            const updatePromises = order.products.map((product) => {
                return Product.updateOne(
                    { name: product.name, "sizes.size": product.size },
                    { $inc: { "sizes.$.quantity": product.quantity } }
                );
            });
            
            await Promise.all(updatePromises);
            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }

    // [PATCH] /admin/transaction/complete/:id
    async completeOrder(req, res, next) {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Sử dụng State Pattern để hoàn thành đơn hàng
            const success = await order.deliverOrder();
            if (!success) {
                return res.status(400).json({ 
                    message: 'Không thể hoàn thành đơn hàng này do trạng thái không phù hợp',
                    currentStatus: order.status
                });
            }

            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }

    // [PATCH] /admin/transaction/confirm/:id
    async confirmOrder(req, res, next) {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            // Sử dụng State Pattern để xác nhận đơn hàng
            const success = await order.confirmOrder();
            if (!success) {
                return res.status(400).json({ 
                    message: 'Không thể xác nhận đơn hàng này do trạng thái không phù hợp',
                    currentStatus: order.status
                });
            }

            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new OrderController(); 