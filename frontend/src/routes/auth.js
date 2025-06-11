const express = require('express');
const router = express.Router();
const authController = require('../app/controllers/AuthController');

// Authentication routes
router.get('/register', authController.register);
router.get('/login', authController.login);
  
// Password reset routes
router.get('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.showResetPassword);

module.exports = router; 