const express = require("express");
const scholarshipRouter = express.Router();

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const {
  handleGetScholarships,
  handleGetScholarshipById,
  handleCreateScholarship,
  handleUpdateScholarship,
  handleDeleteScholarship,
} = require("../controllers/scholarshipController");

// PUBLIC ROUTES

// 1. Get All Scholarships (Search/Filter)
scholarshipRouter.get("/", handleGetScholarships);

// 2. Get Single Scholarship Details
scholarshipRouter.get("/:id", handleGetScholarshipById);

// ADMIN/AGENT ROUTES

// 3. Create Scholarship
scholarshipRouter.post(
  "/",
  isLoggedIn,
  authorize("admin", "agent"),
  handleCreateScholarship
);

// 4. Update Scholarship
scholarshipRouter.put(
  "/:id",
  isLoggedIn,
  authorize("admin", "agent"),
  handleUpdateScholarship
);

// 5. Delete Scholarship
scholarshipRouter.delete(
  "/:id",
  isLoggedIn,
  authorize("admin", "agent"),
  handleDeleteScholarship
);

module.exports = scholarshipRouter;
