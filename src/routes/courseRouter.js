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
const { validateCourse } = require("../validators/courseValidator");
const { runValidation } = require("../validators/index");

// PUBLIC ROUTES

// 1. Get All Courses (Search/Filter)
courseRouter.get("/", validateCourse("getMany"), runValidation, handleGetCourses);

// 2. Get Single Course Details
courseRouter.get("/:id", validateCourse("getOne"), runValidation, handleGetCourseById);

// ADMIN/AGENT ROUTES

// 3. Create Course
courseRouter.post(
  "/",
  validateCourse("create"), 
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleCreateCourse
);

// 4. Update Course
courseRouter.put(
  "/:id",
  validateCourse("update"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleUpdateCourse
);

// 5. Delete Course
courseRouter.delete(
  "/:id",
  validateCourse("delete"),
  runValidation,
  isLoggedIn,
  authorize("admin", "agent"),
  handleDeleteCourse
);

module.exports = courseRouter;

