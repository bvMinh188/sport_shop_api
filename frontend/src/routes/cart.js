const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');

// Cart management routes

router.get('/show', cartController.showCart);

module.exports = router; 