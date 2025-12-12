const express = require("express");
const courseRouter = express.Router();

const {
  handleGetCourses,
  handleGetCourseById,
  handleCreateCourse,
  handleUpdateCourse,
  handleDeleteCourse,
} = require("../controllers/courseController");

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");

// PUBLIC ROUTES

// 1. Get All Courses (Search/Filter)
courseRouter.get("/", handleGetCourses);

// 2. Get Single Course Details
courseRouter.get("/:id", handleGetCourseById);

// ADMIN/AGENT ROUTES

// 3. Create Course
courseRouter.post(
  "/",
  isLoggedIn,
  authorize("admin", "agent"),
  handleCreateCourse
);

// 4. Update Course
courseRouter.put(
  "/:id",
  isLoggedIn,
  authorize("admin", "agent"),
  handleUpdateCourse
);

// 5. Delete Course
courseRouter.delete(
  "/:id",
  isLoggedIn,
  authorize("admin", "agent"),
  handleDeleteCourse
);

module.exports = courseRouter;

