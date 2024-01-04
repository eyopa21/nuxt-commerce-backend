const express = require('express');
const router = express.Router();
const {
    sendMessage
} = require('../controllers/sendMessage.js')


router.route('/send').post(sendMessage)


module.exports = router;