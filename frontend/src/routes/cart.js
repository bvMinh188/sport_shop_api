const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');

// Cart management routes

router.get('/show', cartController.showCart);
router.post('/update/:id', cartController.updateCart);
router.delete('/delete/:id', cartController.deleteCartItem);
router.post('/checkout', cartController.checkout);

module.exports = router; 