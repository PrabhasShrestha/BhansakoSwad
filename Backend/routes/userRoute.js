const express = require('express');
const router = express.Router();
const { signUpValidation , loginValidation, forgetValidation} = require('../helpers/validation');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth')

// User Registration Route
router.post('/register', signUpValidation, userController.register);

// User Verification Code Route
router.post('/verify-code', userController.verifyCode);

// User Login Route
router.post('/login', loginValidation, userController.login);

router.post('/forgot-password', forgetValidation, userController.forgetPassword);

router.post('/reset-password', userController.resetPassword);

router.get('/get-user',auth.isAuthorize,userController.getUser)
module.exports = router;
