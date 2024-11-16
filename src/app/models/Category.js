const mongoose = require('mongoose')
const Schema = mongoose.Schema


const Category = new Schema({
  name: String,
  slug: String,
  products:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
});

  module.exports = mongoose.model('Category', Category);