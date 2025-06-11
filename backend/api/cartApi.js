const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');
const authMiddleware = require('../middleware/auth');

// All cart routes require authentication
router.use(authMiddleware.verifyToken);

// Get cart
router.get('/cart', cartController.getCart);

// Add item to cart
router.post('/cart/add', cartController.addToCart);

// Update cart item
router.put('/cart/update/:itemId', cartController.updateCartItem);

// Remove item from cart
router.delete('/cart/remove/:itemId', cartController.removeFromCart);

// Clear cart
router.delete('/cart/clear', cartController.clearCart);

module.exports = router; 