const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require('mongoose-delete')

const { PendingState, ShippingState, DeliveredState, CancelledState } = require('../states/OrderState');

mongoose.plugin(slug)

const Order = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [{
        name: { type: String, required: true },
        image: { type: String },
        price: { type: String, required: true },
        size: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    price: { type: String, required: true },
    address: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['chờ xác nhận', 'đang giao hàng', 'đã giao hàng', 'đã hủy'], 
        default: 'chờ xác nhận',
        required: true 
    }
}, {
    timestamps: true
});

// Thêm các phương thức instance cho State Pattern
Order.methods.getCurrentState = function() {
    switch(this.status) {
        case 'chờ xác nhận':
            return new PendingState(this);
        case 'đang giao hàng':
            return new ShippingState(this);
        case 'đã giao hàng':
            return new DeliveredState(this);
        case 'đã hủy':
            return new CancelledState(this);
        default:
            return new PendingState(this);
    }
}

// Các phương thức chuyển đổi trạng thái
Order.methods.confirmOrder = async function() {
    const state = this.getCurrentState();
    return await state.confirmOrder();
}

Order.methods.deliverOrder = async function() {
    const state = this.getCurrentState();
    return await state.deliverOrder();
}

Order.methods.cancelOrder = async function() {
    const state = this.getCurrentState();
    return await state.cancelOrder();
}

Order.plugin(mongoosedelte, { deletedAt: true, overrideMethods: true });

module.exports = mongoose.model('Order', Order);
