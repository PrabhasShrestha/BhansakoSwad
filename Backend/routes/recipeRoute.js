const express = require("express");
const router = express.Router();
const  recipeController = require("../controllers/recipeController");
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const uploadPath = path.join(__dirname, "../images");
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
    limits: { fileSize: 10 * 1024 * 1024 } // Limit to 2MB
});



router.get("/recipes", recipeController.getApprovedRecipes);        
router.get("/recipe/:id", recipeController.getRecipeById);      
router.post("/addrecipe", upload.single('image'), auth.isAuthorize, recipeController.createRecipe);          
router.post("/updaterecipe/:id", upload.single('image'), auth.isAuthorize, recipeController.updateRecipe);       
router.delete("/recipe/:id", recipeController.deleteRecipe);
router.get("/search", recipeController.searchRecipe); 
router.post("/filterRecipes", recipeController.filterRecipes);    
router.post("/rate",recipeController.giveratings)
router.get("/ingredients", recipeController.getIngredients);    
router.post("/ingredients/create",recipeController.addIngredients)
router.get("/creator/:id",recipeController.getRecipeById)
router.post("/favorite",recipeController.addFavorite)
router.get("/favorites/:userId",recipeController.getFavorite)
router.delete("/removefavorite", recipeController.removeFavorite);
module.exports = router;
