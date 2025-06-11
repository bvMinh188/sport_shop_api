const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');
// Public routes (không cần authentication)
router.post('/auth/register', userController.signUp);
router.post('/auth/login', userController.logined);
router.post('/auth/logout', userController.logout);
router.post('/auth/forgot-password', userController.handleForgotPassword);
router.post('/auth/reset-password', userController.handleResetPassword);

// Protected routes (cần authentication)
router.use('/users',authMiddleware.verifyToken);
router.get('/users/profile', userController.getProfile);
router.put('/users/profile', userController.updateProfile);
router.put('/users/password', userController.changePassword);

// Address routes (đã được bảo vệ bởi middleware ở trên)
router.post('/users/addresses', userController.addAddress);
router.put('/users/addresses/:id', userController.updateAddress);
router.delete('/users/addresses/:id', userController.deleteAddress);
router.put('/users/set-default-address', userController.setDefaultAddress);

module.exports = router; 