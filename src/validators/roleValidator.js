const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

// Shared field rules
const roleFields = {
  role_name: body("role_name")
    .optional()
    .trim()
    .notEmpty().withMessage("Role name cannot be empty")
    .isIn(["student", "agent", "admin"])
    .withMessage("Role must be one of: student, agent, admin"),

  description: body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters"),
};

// Dynamic validator
exports.validateRole = (mode) => {
  switch (mode) {
    case "create":
      return [
        roleFields.role_name.notEmpty().withMessage("Role name is required"),
        roleFields.description,
      ];

    case "update":
      return [
        param("id").custom((v) => mongoose.Types.ObjectId.isValid(v) || "Invalid Role ID"),
        ...Object.values(roleFields),
      ];

    case "getOne":
    case "delete":
      return [
        param("id").custom((v) => mongoose.Types.ObjectId.isValid(v) || "Invalid Role ID"),
      ];

    case "getMany":
      return [
        query("role_name").optional().isIn(["student", "agent", "admin"]),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
