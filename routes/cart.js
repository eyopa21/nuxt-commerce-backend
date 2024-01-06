const express = require('express');
const router = express.Router();
const {
   addToCart
} = require('../controllers/cart')

router.route('/addtocart').post(addToCart)




module.exports = router;