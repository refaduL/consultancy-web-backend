const express = require("express");
const userRouter = express.Router();

const {getUsers, handleGetUserById, handleDeleteUserById, handleUpdateUserById, handleUpdatePassword,
  processRegister, activateUserAccount, handleManageUserStatusById} = require("../controllers/userController");
const uploadUserImage = require("../middlewares/uploadFile");
const { validateUserRegistration, validateUserPasswordUpdate } = require("../validators/auth");
const { runValidation } = require("../validators");
const { validateObjectId, isLoggedIn, isLoggedOut, isAdmin } = require("../middlewares/auth");


// user routes

// signUp and verify
userRouter.post("/process-register", isLoggedOut, uploadUserImage.single("image"), validateUserRegistration,
  runValidation, processRegister);
userRouter.post("/activate", isLoggedOut, activateUserAccount);

// basic user crud
userRouter.get("/", isLoggedIn, isAdmin, getUsers);
userRouter.get("/:id", isLoggedIn, validateObjectId, handleGetUserById);
userRouter.delete("/:id", isLoggedIn, validateObjectId, handleDeleteUserById);
userRouter.put("/:id", isLoggedIn, uploadUserImage.single("image"), handleUpdateUserById);
userRouter.put("/update-password/:id", 
  validateUserPasswordUpdate, runValidation, isLoggedIn, validateObjectId, handleUpdatePassword);
userRouter.put("/manage-user/:id", isLoggedIn, isAdmin, validateObjectId, handleManageUserStatusById);

userRouter.get("/profile", (req, res) => {
  res.status(200).send({
    message: "user returned succesfully",
  });
});

module.exports = userRouter;
