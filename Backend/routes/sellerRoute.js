const express = require('express');
const router = express.Router();
const {
    registerSellerValidation,
    loginSellerValidation,
  } = require('../helpers/validation');
  const sellerController = require('../controllers/sellerController');
  
  router.post('/registerseller', registerSellerValidation, sellerController.registerSeller);
  router.post('/loginseller', loginSellerValidation, sellerController.loginSeller);
  router.post('/verifyseller', sellerController.verifySellerCode);
  router.post('/resendseller', sellerController.resendSellerCode);

module.exports = router;
