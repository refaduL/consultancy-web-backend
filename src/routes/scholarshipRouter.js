const express = require("express");
const scholarshipRouter = express.Router();

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const { validateScholarship } = require("../validators/scholarshipValidator");
const { runValidation } = require("../validators/index");
const {
  handleGetScholarships,
  handleGetScholarshipById,
  handleCreateScholarship,
  handleUpdateScholarship,
  handleDeleteScholarship,
} = require("../controllers/scholarshipController");

// PUBLIC ROUTES

// 1. Get All Scholarships (Search/Filter)
scholarshipRouter.get(
  "/",
  validateScholarship("getMany"),
  runValidation,
  handleGetScholarships
);

// 2. Get Single Scholarship Details
scholarshipRouter.get(
  "/:id",
  validateScholarship("getOne"),
  runValidation,
  handleGetScholarshipById
);

// ADMIN/AGENT ROUTES

// 3. Create Scholarship
scholarshipRouter.post(
  "/",
  validateScholarship("create"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleCreateScholarship
);

// 4. Update Scholarship
scholarshipRouter.put(
  "/:id",
  validateScholarship("update"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleUpdateScholarship
);

// 5. Delete Scholarship
scholarshipRouter.delete(
  "/:id",
  validateScholarship("delete"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleDeleteScholarship
);

module.exports = scholarshipRouter;
