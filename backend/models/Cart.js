const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require('mongoose-delete')

mongoose.plugin(slug)

const Cart = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
});

Cart.plugin(mongoosedelte, { deletedAt: true, overrideMethods: true });

module.exports = mongoose.model('Cart', Cart);
