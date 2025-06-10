const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Auth routes
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);

// Protected routes
router.use('/users', protect);
router.get('/users/profile', userController.getProfile);
router.put('/users/profile', userController.updateProfile);
router.put('/users/password', userController.changePassword);

// Address routes
router.post('/users/addresses', userController.addAddress);
router.put('/users/addresses/:id', userController.updateAddress);
router.delete('/users/addresses/:id', userController.deleteAddress);
router.put('/users/addresses/:id/default', userController.setDefaultAddress);

module.exports = router; 