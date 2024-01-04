const express = require('express');
const router = express.Router();
const {
   logs
} = require('../controllers/logs')

router.route('/logs').post(logs)



module.exports = router;