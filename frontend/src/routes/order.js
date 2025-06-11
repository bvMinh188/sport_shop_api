const express = require('express');
const router = express.Router();
const orderController = require('../app/controllers/OrderController');

// Order management routes
router.post('/checkout', orderController.checkout);
router.delete('/cancel/:id', orderController.cancelOrder);

module.exports = router; 