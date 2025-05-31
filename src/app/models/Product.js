const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require(  'mongoose-delete')

mongoose.plugin(slug)

const Product = new Schema({
  name: String,
  categoryId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Category",
    require: true
  },
  category: String,
  sizes: [
    {
      size: { type: Number, required: true },    // Kích thước
      quantity: { type: Number, required: true, default: 0 } // Số lượng
    }
  ],
  sold: { type: Number, default: 0 }, // Số lượng đã bán
  price: Number,
  originalPrice: Number, // Giá gốc trước khi giảm
  discount: Number, // Phần trăm giảm giá
  description: String,
  image: String,
  slug: { type: String, slug: 'name' },
}, {
  timestamps : true,
},{ strict: true });
Product.plugin(mongoosedelte, {deletedAt: true, overrideMethods: true })

  module.exports = mongoose.model('Product', Product);