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

// Add to validation.js
exports.updateSellerValidation = [
  check('shop_name', 'Shop name is required').not().isEmpty(),
  check('owner_name', 'Owner name is required').not().isEmpty(),
  check('store_address', 'Store address is required').not().isEmpty(),
  check('email', 'A valid email is required')
  .not()
  .isEmpty()
  .withMessage('Email is required')
  .bail()
  .isEmail()
  .withMessage('Invalid email format'),
  check('phone_number', 'Valid phone number required')
    .isMobilePhone('ne-NP')
    .isLength({ min: 10, max: 10 }),
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

// Validation adding products
exports.addproductsValidation = [
  check("name", "Product name is required").not().isEmpty().trim().isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  check("category", "Category is required").not().isEmpty().trim().isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters"),

  check("price", "Price must be a positive number").isFloat({ gt: 0 }),

  check("in_stock", "Stock must be a non-negative integer").isInt({ min: 0 }),

  check("description", "Description is required").not().isEmpty().trim().isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  check("image").custom((value, { req }) => {
    // If no file is provided, skip validation for the image
    if (!req.file) {
      return true;
    }

    // Validate if file exists and is of correct type
    if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/png") {
      return true;
    }
    throw new Error("Please upload an image of type JPG or PNG");
  }),
];

exports.updateproductsValidation = [
  check("name").optional().trim().notEmpty().withMessage("Products name cannot be empty")
    .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),

  check("category").optional().trim().notEmpty().withMessage("Category cannot be empty")
    .isLength({ max: 50 }).withMessage("Category cannot exceed 50 characters"),

  check("quantity").optional().isFloat({ gt: 0 }).withMessage("Quantity must be a positive number"),

  check("unit").optional().trim().notEmpty().withMessage("Unit cannot be empty")
    .isLength({ max: 20 }).withMessage("Unit cannot exceed 20 characters"),

  check("in_stock").optional().isBoolean().withMessage("In-stock status must be a boolean value"),

  check("description").optional().isEmpty().trim().withMessage("Description is required")
  .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

  check("image").custom((value, { req }) => {
    // If no file is provided, skip validation for the image
    if (!req.file) {
      return true;
    }

    // Validate if file exists and is of correct type
    if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/png") {
      return true;
    }
    throw new Error("Please upload an image of type JPG or PNG");
  }),
];

exports.registerChefValidation = [
  check("name", "Name is required").not().isEmpty().trim(),
  check("email", "Valid email is required")
    .not()
    .isEmpty()
    .bail()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail({ gmail_remove_dots: true }),
  check("specialty", "Specialty is required").not().isEmpty().trim(),
  check("phone_number", "Invalid phone number format for Nepal")
    .isMobilePhone("ne-NP")
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone number must be exactly 10 digits"),
  check("password", "Password must be at least 6 characters long")
    .not()
    .isEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];
