const express = require('express');
const router = express.Router();
const {
    login
} = require('../controllers/auth')

//router.route('/').post(login)

//router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp)

module.exports = router;