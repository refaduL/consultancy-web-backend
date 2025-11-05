const express = require("express");
const seedRouter = express.Router();

const { seedUser } = require("../controllers/seedController.js");
// const upload = require("../middlewares/uploadFile");
const { validateUserRegistration } = require("../validators/auth");
const { runValidation } = require("../validators");

// seedRouter.get("/users", upload.single('image'), validateUserRegistration, runValidation, seedUser);
seedRouter.get("/users", validateUserRegistration, runValidation, seedUser);

module.exports = seedRouter;
