const express = require('express');
const router = express.Router();
const {
    signUpValidation,
    loginValidation,
    forgetValidation,
    updateProfileValidation,
} = require('../helpers/validation');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const path = require('path');
const multer = require('multer');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.join(__dirname, '../uploads/users');
        if (process.env.NODE_ENV !== 'production') {
            console.log('Storing file in:', uploadPath); // Debug log
        }
        callback(null, uploadPath);
    },
    filename: function (req, file, callback) {
        const name = Date.now() + '-' + file.originalname;
        callback(null, name);
    }
});

// File filter and size limit
const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        callback(null, true); // Accept the file
    } else {
        callback(new Error('Only JPG and PNG images are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit to 2MB
});

// Routes
router.post('/register', signUpValidation, userController.register);
router.post('/verify-code', userController.verifyCode);
router.post('/login', loginValidation, userController.login);
router.post('/forgot-password', forgetValidation, userController.forgetPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/resend-code', userController.resendCode);
router.post('/change-password', auth.isAuthorize,userController.changePassword);

// Handle file uploads and validation in update-profile
router.post(
    '/update-profile',
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: 'File upload failed. Please try again.' });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            next(); // Continue to the next middleware
        });
    },
    updateProfileValidation,
    auth.isAuthorize,
    userController.updateProfile
);

;

router.post("/upload-image", auth.isAuthorize, upload.single('image'), userController.uploadImage);
router.delete("/remove-image", auth.isAuthorize, userController.removeImage);
router.get('/get-user', auth.isAuthorize, userController.getUser);
router.post('/testimonials', auth.isAuthorize, userController.saveTestimonial);
router.get('/testimonials', userController.getTestimonial);
router.post('/logout', auth.isAuthorize, userController.logout);
router.get('/getstore',userController.getStores)


module.exports = router;
