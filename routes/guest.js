const express = require('express');
const router = express.Router();
const {
    registerGuest,
    guestLogin
} = require('../controllers/guest')

router.route('/register').post(registerGuest)
router.route('/login').post(guestLogin)


module.exports = router;