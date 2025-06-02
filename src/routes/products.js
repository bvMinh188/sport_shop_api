const express = require('express')
const router = express.Router()

const productController = require('../app/controllers/ProductController')

// Product routes
router.get('/search', productController.search)
router.get('/category/:category', productController.getByCategory)
router.get('/filter', productController.filter)
router.get('/:slug', productController.showProduct)

module.exports = router;