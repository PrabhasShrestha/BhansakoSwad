const express = require('express');
const router = express.Router();
const { 
  registerSellerValidation,
  loginSellerValidation,
  updateSellerValidation
} = require('../helpers/validation');
const sellerController = require('../controllers/sellerController');
const { isAuthorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer storage
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.join(__dirname, "../uploads/ingredients");
        if (process.env.NODE_ENV !== "production") {
            console.log("Storing file in:", uploadPath); // Debug log
        }
        callback(null, uploadPath);
    },
    filename: function (req, file, callback) {
        const name = Date.now() + "-" + file.originalname;
        callback(null, name);
    }
});

// File filter and size limit
const fileFilter = (req, file, callback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        callback(null, true); // Accept the file
    } else {
        callback(new Error("Only JPG and PNG images are allowed!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit to 2MB
});

// Existing routes
router.post('/registerseller', registerSellerValidation, sellerController.registerSeller);
router.post('/loginseller', loginSellerValidation, sellerController.loginSeller);
router.post('/verifyseller', sellerController.verifySellerCode);
router.post('/resendseller', sellerController.resendSellerCode);

// New vendor profile routes
router.get('/get-seller', isAuthorize, sellerController.getSeller);
// Change from PUT to POST

router.post('/update-seller', isAuthorize, upload.single('image'), updateSellerValidation, sellerController.updateSeller);
router.post('/upload-seller-image', isAuthorize, upload.single('image'), sellerController.uploadImage);
router.delete('/remove-seller-image', isAuthorize, sellerController.removeImage);

//AddIngridients
router.post("/addingredient", isAuthorize, upload.single("image"), addIngredientValidation, sellerController.addIngredient);
router.get("/getingredient", isAuthorize, sellerController.getIngredient);
router.post("/updateingredient", isAuthorize, upload.single("image"), updateIngredientValidation, sellerController.updateIngredient);
router.delete("/deleteingredient", isAuthorize, sellerController.deleteIngredient);
router.post("/upload-image-ingredient", isAuthorize, upload.single("image"), sellerController.uploadIngredientImage);
router.delete("/remove-image-ingredient", isAuthorize, sellerController.removeIngredientImage);

module.exports = router;