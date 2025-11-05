const express = require("express");
const authRouter = express.Router();

const { validateUserRegistration, validateUserLogin } = require("../validators/auth");
const { runValidation } = require("../validators");
const { handleLogin, handleLogout } = require("../controllers/authController");
const { isLoggedOut, isLoggedIn } = require("../middlewares/auth");

authRouter.post("/login", validateUserLogin, runValidation, isLoggedOut, handleLogin);
authRouter.post("/logout", isLoggedIn, handleLogout);

module.exports = authRouter;
