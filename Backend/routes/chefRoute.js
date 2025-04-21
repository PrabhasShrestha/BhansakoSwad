const express = require('express');
const chefController = require('../controllers/chefController');
const { 
    registerChefValidation
} = require('../helpers/validation');
const router = express.Router();
const { isAuthorize } = require('../middleware/auth');

router.post("/chefRegister", registerChefValidation, chefController.registerChef);
router.get("/chef", chefController.getAllChefs);
router.post("/:id/status", chefController.updateChefStatus);
router.post("/:id/verify", chefController.verifyChefDocuments);
router.post("/loginchef", chefController.loginChef);
router.get("/chefinfo/:id", chefController.getChefById);
router.get('/:id/recipes', chefController.getChefRecipe);
router.get('/me', isAuthorize, chefController.getCurrentChef);
router.get('/recipes', isAuthorize, chefController.getChefRecipes);
router.get('/ratings', isAuthorize, chefController.getChefRatings);
router.get('/activities', isAuthorize, chefController.getActivities);
router.post('/upload-photo', isAuthorize, chefController.uploadPhoto);
router.put('/profile', isAuthorize, chefController.updateProfile);

module.exports = router;