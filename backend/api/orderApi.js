const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use('/orders', protect);

// Customer routes
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id/cancel', orderController.cancelOrder);

// Admin routes
router.put('/orders/:id/status', protect, admin, orderController.updateOrderStatus);

module.exports = router; 