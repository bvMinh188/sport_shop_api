const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Category = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    slug: {
        type: String,
        unique: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', Category);