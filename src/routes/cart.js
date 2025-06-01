const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');

// Cart management routes
router.post('/add/:id', cartController.addProductCart);
router.get('/show', cartController.showCart);
router.post('/update/:id', cartController.updateCart);
router.delete('/delete/:id', cartController.deleteCartItem);

module.exports = router; 