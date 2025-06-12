const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');


// Public routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Admin routes

router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Get products by category ID
router.get('/categories/:id/products', categoryController.getCategoryProducts);

// Total endpoints
router.get('/totalcategories', categoryController.totalCategories);

module.exports = router;