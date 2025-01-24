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

exports.updateProfileValidation = [
  check('first_name', 'This field is required').not().isEmpty(),
  check('last_name', 'This field is required').not().isEmpty(),
  check('address', 'This field is required').not().isEmpty(),
  check('email', 'This field is required').not().isEmpty().isEmail().normalizeEmail({ gmail_remove_dots: true }),
  check('phone_number', 'Invalid phone number format for Nepal').isMobilePhone('ne-NP').isLength({ min: 10, max: 10 }),
  check('image').custom((value, { req }) => {
    // If no file is provided, skip validation for the image
    if (!req.file) {
      return true;
    }

    // Validate if file exists
    if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png') {
      return true;
    }
    throw new Error('Please upload an image of type JPG or PNG');
  }),
];


  

