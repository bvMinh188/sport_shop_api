const express = require('express');
const router = express.Router();
const authController = require('../app/controllers/AuthController');

// Authentication routes
router.get('/register', authController.register);
router.post('/signup', authController.signUp);
router.get('/login', authController.login);
router.post('/logined', authController.logined);
router.post('/logout', authController.logout);
  
// Password reset routes
router.get('/forgot-password', authController.forgotPassword);
router.post('/forgot-password', authController.handleForgotPassword);
router.get('/reset-password/:token', authController.showResetPassword);
router.post('/reset-password', authController.handleResetPassword);

module.exports = router; 