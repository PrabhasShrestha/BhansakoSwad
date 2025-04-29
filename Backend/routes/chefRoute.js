const express = require('express');
const chefController = require('../controllers/chefController');
const { 
    registerChefValidation
} = require('../helpers/validation');
const router = express.Router();
const { isAuthorize } = require('../middleware/auth');

router.post("/chefRegister", chefController.registerChef);
router.get("/chef", chefController.getAllChefs);
router.post("/:id/status", chefController.updateChefStatus);
router.post("/:id/verify", chefController.verifyChefDocuments);
router.get("/chefinfo/:id", chefController.getChefById);
router.get('/:id/recipes', chefController.getChefRecipe);
router.get('/me', isAuthorize, chefController.getCurrentChef);
router.get('/recipes', isAuthorize, chefController.getChefRecipes);
router.get('/ratings', isAuthorize, chefController.getChefRatings);
router.post('/upload-photo', isAuthorize, chefController.uploadPhoto);
router.post('/profile', isAuthorize, chefController.updateProfile);

module.exports = router;