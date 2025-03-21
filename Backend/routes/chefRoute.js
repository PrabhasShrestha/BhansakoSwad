const express = require('express');
const chefController = require('../controllers/chefController');
const { 
    registerChefValidation
  } = require('../helpers/validation');
const router = express.Router();


router.post("/chefRegister", chefController.registerChef, registerChefValidation)
router.get("/chef",chefController.getAllChefs)
router.post("/:id/status",chefController.updateChefStatus)
router.post("/:id/verify",chefController.verifyChefDocuments)
router.post("/loginchef", chefController.loginChef);


module.exports = router;