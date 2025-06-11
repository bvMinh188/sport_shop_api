const express = require('express')
const router = express.Router()

const productController = require('../app/controllers/ProductController')

// Product routes
router.get('/search', productController.search)
router.get('/:id', productController.showProduct)

module.exports = router;