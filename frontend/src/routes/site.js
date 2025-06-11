const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../app/models/User')
const siteController = require('../app/controllers/SiteController')
const dotenv = require('dotenv')
dotenv.config()

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';


// Site routes
router.get('/', siteController.index);

module.exports = router;