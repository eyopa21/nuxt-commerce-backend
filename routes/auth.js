const express = require('express');
const router = express.Router();
const {
    login,
    signUp,
    verify,
    changePassword,
    forgotPassword
} = require('../controllers/auth/user')

router.route('/user/login').post(login)
router.route('/user/signup').post(signUp)
router.route('/user/verify').post(verify)
router.route('/forgotpassword').post(forgotPassword)
router.route('/changepassword').post(changePassword)

//router.route('/:id').get(getBootcamp).put(updateBootcamp).delete(deleteBootcamp)

module.exports = router;