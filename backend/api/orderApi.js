const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
// const authMiddleware = require('../middleware/auth')

// Customer routes
router.get('/orders/allorders',orderController.getAllOrders);
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);

// Admin routes
router.put('/orders/:id/cancel', orderController.cancelOrder);
router.put('/orders/:id/confirm', orderController.confirmOrder);
router.put('/orders/:id/complete', orderController.completeOrder);

// Total endpoints
router.get('/totalorders', orderController.totalOrders);



module.exports = router; 