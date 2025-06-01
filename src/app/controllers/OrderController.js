const Order = require('../models/Order');
const Product = require('../models/Product');
const { mutipleMongooseToObject } = require('../../util/mongoose');

class OrderController {
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