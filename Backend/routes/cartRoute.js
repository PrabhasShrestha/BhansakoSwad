const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController')
const auth = require('../middleware/auth');

 // Cart Routes
 router.post("/add", auth.isAuthorize, cartController.addToCart);
 router.get("/:user_id", auth.isAuthorize, cartController.getCart);
 router.post("/remove", auth.isAuthorize, cartController.removeFromCart);
 router.post("/update-quantity", auth.isAuthorize, cartController.updateCartQuantity);
 router.post("/clear-cart", auth.isAuthorize, cartController.deleteCart);


module.exports = router;
