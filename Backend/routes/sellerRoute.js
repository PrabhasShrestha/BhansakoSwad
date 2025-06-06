const express = require('express');
const router = express.Router();
const { 
  registerSellerValidation,
  loginSellerValidation,
  updateSellerValidation,
  addproductsValidation,
  updateproductsValidation,
  forgetValidation
} = require('../helpers/validation');
const sellerController = require('../controllers/sellerController');
const { isAuthorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.join(__dirname, "../uploads/products");
        if (process.env.NODE_ENV !== "production") {
            console.log("Storing file in:", uploadPath); 
        }
        callback(null, uploadPath);
    },
    filename: function (req, file, callback) {
        const name = Date.now() + "-" + file.originalname;
        callback(null, name);
    }
});


const fileFilter = (req, file, callback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        callback(null, true); 
    } else {
        callback(new Error("Only JPG and PNG images are allowed!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } 
});

const sellerStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.join(__dirname, "../uploads/sellers");
        if (process.env.NODE_ENV !== "production") {
            console.log("Storing seller image in:", uploadPath); 
        }
        callback(null, uploadPath);
    },
    filename: function (req, file, callback) {
        const name = Date.now() + "-" + file.originalname;
        callback(null, name);
    }
});

const sellerFileFilter = (req, file, callback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        callback(null, true);
    } else {
        callback(new Error("Only JPG and PNG images are allowed for sellers!"), false);
    }
};

const uploadSellerImage = multer({
    storage: sellerStorage,
    fileFilter: sellerFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } 
});

router.post('/registerseller', registerSellerValidation, sellerController.registerSeller);
router.post('/verifyseller', sellerController.verifySellerCode);
router.post('/resendseller', sellerController.resendSellerCode);
router.get('/get-seller', isAuthorize, sellerController.getSeller);
router.post('/update-seller', isAuthorize, uploadSellerImage.single('image'), updateSellerValidation, sellerController.updateSeller);
router.post('/upload-seller-image', isAuthorize, uploadSellerImage.single('image'), sellerController.uploadImage);
router.delete('/remove-seller-image', isAuthorize, sellerController.removeImage);


router.post("/addproducts", isAuthorize, upload.single("image"), addproductsValidation, sellerController.addproducts);
router.get("/getproducts", isAuthorize, sellerController.getproducts);
router.post("/updateproducts", isAuthorize, upload.single("image"), updateproductsValidation, sellerController.updateproducts);
router.delete("/deleteproducts", isAuthorize, sellerController.deleteproducts);
router.post("/upload-image-products", isAuthorize, upload.single("image"), sellerController.uploadproductsImage);
router.delete("/remove-image-products", isAuthorize, sellerController.removeproductsImage);
router.get("/store/:id", sellerController.getProductsByStore);
router.get("/store/details/:id", sellerController.getStoreById);
router.get("/product/:id", sellerController.getProductById);
router.get("/store/:storeId/products", sellerController.getPublicProducts);
router.get("/related/:sellerId/:productId", sellerController.getRelatedProducts);
router.post("/create-order", sellerController.createOrder);
router.post("/save-order-items", sellerController.saveOrderItems);
router.get("/orders/vendor/:vendorId", sellerController.getOrders);
router.post("/orders/:id/status", sellerController.updateStatus);



module.exports = router;