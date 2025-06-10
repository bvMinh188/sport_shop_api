const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Admin routes
router.use('/categories', protect, admin);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Get products by category ID
router.get('/categories/:id/products', categoryController.getCategoryProducts);

module.exports = router; 