const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

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
    async cancelOrder(req, res, next) {
        try {
            const order = await Order.findByIdAndUpdate(req.params.id, { status: "đã hủy" });
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
            await Order.findByIdAndUpdate(req.params.id, { status: "đã giao" });
            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }

    // [PATCH] /admin/transaction/confirm/:id
    async confirmOrder(req, res, next) {
        try {
            await Order.findByIdAndUpdate(req.params.id, { status: "đang giao" });
            res.redirect('back');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new OrderController(); 