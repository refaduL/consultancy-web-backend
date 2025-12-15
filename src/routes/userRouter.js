const express = require("express");
const userRouter = express.Router();

const uploadUserImage = require("../middlewares/uploadFile");
const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const { validateUser } = require("../validators/userValidator");
const { runValidation } = require("../validators/index");
const { getUsers, handleGetUserById, handleUpdateUserById, handleDeleteUserById, getAgents } = require("../controllers/userController");


// 1. Get All Users (Admin only)
userRouter.get("/", validateUser("getMany"), runValidation, isLoggedIn, authorize('admin', 'agent'), getUsers);
userRouter.get("/agents", validateUser("getMany"), runValidation, isLoggedIn, authorize('admin'), getAgents);
// userRouter.get("/", getUsers);

// 2. Get Single User (Admin or the specific user)
userRouter.get("/:id", validateUser("getOne"), runValidation, isLoggedIn, handleGetUserById);

// 3. Update User Profile (Own profile or Admin)
// Expects 'image' field in form-data for profile picture
userRouter.put("/:id", validateUser("update"), runValidation, isLoggedIn, uploadUserImage.single("image"), handleUpdateUserById);

// 4. Delete User (Admin only)
userRouter.delete("/:id", validateUser("delete"), runValidation, isLoggedIn, authorize('admin'), handleDeleteUserById);
// userRouter.delete("/:id", handleDeleteUserById);


module.exports = userRouter;
