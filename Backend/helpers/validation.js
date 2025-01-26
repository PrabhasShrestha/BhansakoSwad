const { check } = require('express-validator');

// Validation for user registration
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


// Validation for seller registration
exports.registerSellerValidation = [
  check('shop_name', 'Shop name is required').not().isEmpty(),
  check('owner_name', 'Owner name is required').not().isEmpty(),
  check('store_address', 'Store address is required').not().isEmpty(),
  check('email', 'A valid email is required')
    .not()
    .isEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: true }),
  check('phone_number', 'Invalid phone number format for Nepal')
    .isMobilePhone('ne-NP')
    .isLength({ min: 10, max: 10 }) // Ensure exactly 10 digits
    .withMessage('Phone number must be exactly 10 digits'),
  check('password', 'Password must be at least 6 characters long')
    .not()
    .isEmpty()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Validation for seller login
exports.loginSellerValidation = [
  check('email', 'Email is required')
    .not()
    .isEmpty()
    .bail()
    .isEmail()
    .withMessage('Invalid email format'),
  check('password', 'Password is required').not().isEmpty(),
];