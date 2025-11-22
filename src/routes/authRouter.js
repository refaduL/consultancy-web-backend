const express = require("express");
const authRouter = express.Router();

// const { validateUserRegistration, validateUserLogin } = require("../validators/auth");
// const { runValidation } = require("../validators");
const { isLoggedIn, isLoggedOut } = require("../middlewares/authMiddleware");
const { registerUser, activateUserAccount, loginUser, getProfile, logoutUser } = require("../controllers/authController");

// Public Routes
authRouter.post("/register", isLoggedOut, registerUser); 
authRouter.post("/activate", isLoggedOut, activateUserAccount);
authRouter.post("/login", isLoggedOut, loginUser);

// Protected Routes
authRouter.get("/me", isLoggedIn, getProfile);
authRouter.post("/logout", logoutUser);


// userRouter.put("/update-password/:id", isLoggedIn, handleUpdatePassword);

module.exports = authRouter;
