const { check } = require('express-validator');

exports.signUpValidation = [
  check('first_name', 'This field is required').not().isEmpty(),
  check('last_name', 'This field is required').not().isEmpty(),
  check('address', 'This field is required').not().isEmpty(),
  check('email', 'This field is required').not().isEmpty().isEmail().normalizeEmail({ gmail_remove_dots: true }),
  check('password', 'This field is required').not().isEmpty(),
  check('phone_number', 'Invalid phone number format for Nepal').isMobilePhone('ne-NP').isLength({ min: 10, max: 10 }) // Ensure it is exactly 10 digits
];

exports.loginValidation = [
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .bail()
        .isEmail()
        .withMessage('Invalid email format'),
    check('password')
        .notEmpty()
        .withMessage('Password is required'),
];

exports.forgetValidation = [
  check('email')
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Invalid email format')
];
  

