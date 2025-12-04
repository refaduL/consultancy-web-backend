const express = require("express");
const universityRouter = express.Router();

const {
  handleGetUniversities,
  handleGetUniversityById,
  handleCreateUniversity,
  handleUpdateUniversity,
  handleDeleteUniversity,
} = require("../controllers/universityController");

const {
  isLoggedIn,
  authorize,
} = require("../middlewares/authMiddleware");

// Public Routes
universityRouter.get("/", handleGetUniversities);
universityRouter.get("/:id", handleGetUniversityById);

// Admin Routes
universityRouter.post(
  "/",
  isLoggedIn,
  authorize("admin", "agent"),
  handleCreateUniversity
);
universityRouter.put(
  "/:id",
  isLoggedIn,
  authorize("admin", "agent"),
  handleUpdateUniversity
);
universityRouter.delete(
  "/:id",
  isLoggedIn,
  authorize("admin", "agent"),
  handleDeleteUniversity
);

module.exports = universityRouter;
