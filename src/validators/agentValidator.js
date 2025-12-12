const mongoose = require("mongoose");
const { body, param } = require("express-validator");

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// Shared rules for agent fields
const agentFields = {
  user: body("user")
    .optional()
    .notEmpty().withMessage("User ID cannot be empty")
    .custom((v) => isMongoId(v) || "Invalid User ID"),

  bio: body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),

  specializations: body("specializations")
    .optional()
    .isArray().withMessage("Specializations must be an array of strings")
    .custom(arr => arr.every(item => typeof item === "string"))
    .withMessage("Each specialization must be a string"),

  rating: body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 }).withMessage("Rating must be between 0 and 5"),

  review_count: body("review_count")
    .optional()
    .isInt({ min: 0 }).withMessage("Review count must be a positive number"),

  status: body("status")
    .optional()
    .isIn(["active", "inactive", "on_leave"])
    .withMessage("Invalid status value"),

  active_students_limit: body("active_students_limit")
    .optional()
    .isInt({ min: 1 }).withMessage("Student limit must be a positive number"),
};

// Dynamic validator
exports.validateAgent = (mode) => {
  switch (mode) {
    case "create":
      return [
        agentFields.user.notEmpty().withMessage("User ID is required"),
        agentFields.bio,
        agentFields.specializations,
        agentFields.rating,
        agentFields.review_count,
        agentFields.status,
        agentFields.active_students_limit,
      ];

    case "update":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Agent ID"),
        ...Object.values(agentFields), // all fields optional but validated if present
      ];

    case "getOne":
    case "delete":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Agent ID"),
      ];

    default:
      return [];
  }
};
