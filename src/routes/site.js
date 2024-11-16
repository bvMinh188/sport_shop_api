const express =require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../app/models/User')
const siteController = require('../app/controllers/SiteController')
const dotenv = require('dotenv')
dotenv.config()


const SECRET_CODE = process.env.SECRET_CODE || 'Minh';



var checkLogin = (req,res,next) => {
    var token = req.cookies?.token;
    if(!token){
        next()
    }else{
        var idUser = jwt.verify(token,SECRET_CODE);
        User.findOne({_id: idUser._id})
            .then(data => {
                req.data = data;
                next();
            }).catch(err => {
                console.log(err.message);
            })
    }
}

var checkUser = (req,res,next) => {
    
    if(req.data){
        var role = req.data.role;
        if(role == 'user'){
            res.redirect("/")
        }else if(role == 'admin'){
            res.redirect("/admin")
        }
    }else if(!req.data){
        next();
    }
}

router.get('/register', siteController.register);
router.get('/login', checkLogin, siteController.login);
router.post('/logined', siteController.logined);
router.get('/logout',function(req,res){
    res.clearCookie('token');
    res.redirect('/login');
} );
router.post('/signup', siteController.signUp);
router.post('/order/:id', siteController.addProductCart);
router.get('/order', checkLogin, siteController.showOrder)
router.post('/checkout', checkLogin, siteController.checkout)
router.post('/update-order/:id', checkLogin, siteController.updateOrder)
router.delete('/delete-order/:id', checkLogin, siteController.deleteOrder)
router.get('/profile', checkLogin, siteController.profile)


router.get('/:slug', siteController.showProduct)
router.get('/', checkLogin, siteController.index)



module.exports = router;