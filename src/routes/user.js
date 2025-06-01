const express = require('express');
const router = express.Router();
const userController = require('../app/controllers/UserController');

// Profile routes
router.get('/profile', userController.profile);
router.post('/account/updateprofile', userController.updateProfile);

// Address management routes
router.post('/add-address', userController.addAddress);
router.post('/set-default-address', userController.setDefaultAddress);

module.exports = router; 