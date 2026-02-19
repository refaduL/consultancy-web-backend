const express = require("express");
const documentRouter = express.Router();

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const { handleDeleteDocument } = require("../controllers/documentController");

// Public Routes
documentRouter.delete("/:field", isLoggedIn, authorize("student", "agent"), handleDeleteDocument); 

// Protected Routes

module.exports = documentRouter;
