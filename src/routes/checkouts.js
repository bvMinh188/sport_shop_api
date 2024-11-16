const express =require('express')
const router = express.Router()

const checkoutController = require('../app/controllers/CartController')


router.get('/:slug', checkoutController.checkouts)

module.exports = router;