const express = require('express');
const router = express.Router();
const {
   addToCart, 
  order
} = require('../controllers/cart')

router.route('/addtocart').post(addToCart)
router.route('/order').post(order)




module.exports = router;