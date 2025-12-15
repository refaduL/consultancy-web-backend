const express = require("express");
const universityRouter = express.Router();

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const { validateUniversity } = require("../validators/universityValidator");
const { runValidation } = require("../validators/index");
const {
  handleGetUniversities,
  handleGetUniversityById,
  handleCreateUniversity,
  handleUpdateUniversity,
  handleDeleteUniversity,
} = require("../controllers/universityController");


// Public Routes
universityRouter.get(
  "/",
  validateUniversity("getMany"),
  runValidation,
  handleGetUniversities
);
universityRouter.get(
  "/:id",
  validateUniversity("getOne"),
  runValidation,
  handleGetUniversityById
);

// Admin Routes
universityRouter.post(
  "/",
  validateUniversity("create"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleCreateUniversity
);
universityRouter.put(
  "/:id",
  validateUniversity("update"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleUpdateUniversity
);
universityRouter.delete(
  "/:id",
  validateUniversity("delete"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleDeleteUniversity
);

module.exports = universityRouter;
