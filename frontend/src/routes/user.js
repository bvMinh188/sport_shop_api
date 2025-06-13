const express = require('express');
const router = express.Router();
const userController = require('../app/controllers/UserController');

// Profile routes
router.get('/profile', userController.profile);

module.exports = router; 