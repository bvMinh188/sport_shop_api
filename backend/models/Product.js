const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require('mongoose-delete')

mongoose.plugin(slug)

const Product = new Schema({
  name: { type: String, required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  category: { type: String, required: true },
  sizes: [
    {
      size: { type: Number, required: true },    // Kích thước
      quantity: { type: Number, required: true, default: 0 } // Số lượng
    }
  ],
  sold: { type: Number, default: 0 }, // Số lượng đã bán
  price: { type: Number, required: true },
  originalPrice: Number, // Giá gốc trước khi giảm
  discount: Number, // Phần trăm giảm giá
  description: { type: String, required: true },
  image: { type: String, required: true },
  slug: { type: String, slug: 'name' },
  // Thêm các trường cho từng loại sản phẩm
  sportType: { type: String }, // Cho giày thể thao
  style: { type: String }, // Cho giày casual
}, {
  timestamps: true,
  strict: false // Cho phép thêm các trường động
});

Product.plugin(mongoosedelte, { deletedAt: true, overrideMethods: true })

module.exports = mongoose.model('Product', Product);