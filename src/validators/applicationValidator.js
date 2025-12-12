const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// Shared field rules
const applicationFields = {
  user: body("user")
    .optional()
    .notEmpty().withMessage("User ID cannot be empty")
    .custom((v) => isMongoId(v) || "Invalid User ID"),

  agent: body("agent")
    .optional()
    .custom((v) => !v || isMongoId(v) || "Invalid Agent ID"),

  status: body("status")
    .optional()
    .isIn(["draft","submitted","accepted","approved","rejected"])
    .withMessage("Invalid status"),

  rejectionFeedback: body("rejectionFeedback")
    .optional()
    .trim()
    .notEmpty().withMessage("Rejection feedback cannot be empty"),

  // Education history array
  educationHistory: body("educationHistory")
    .optional()
    .isArray().withMessage("Education history must be an array")
    .custom((arr) => arr.every(ed => ed.institution && ed.degree && ed.fieldOfStudy && ed.graduationYear))
    .withMessage("Each education entry must have institution, degree, fieldOfStudy, graduationYear"),

  // Preferences
  "preferences.preferredCountries": body("preferences.preferredCountries")
    .optional()
    .isArray().withMessage("Preferred countries must be an array of strings"),
  "preferences.preferredFieldOfStudy": body("preferences.preferredFieldOfStudy")
    .optional()
    .trim(),
  "preferences.preferredIntake": body("preferences.preferredIntake")
    .optional()
    .trim(),

  // Financial info
  "financial_info.funding_source": body("financial_info.funding_source")
    .optional()
    .isIn(["Self-funded","Education Loan","Scholarship","Sponsor"])
    .withMessage("Invalid funding source"),
  "financial_info.budget_range_usd": body("financial_info.budget_range_usd")
    .optional()
    .trim(),
};

// Dynamic validator
exports.validateApplication = (mode) => {
  switch (mode) {
    case "create":
      return [
        applicationFields.user.notEmpty().withMessage("User ID is required"),
        applicationFields.status, // optional, defaults to draft
        applicationFields.agent,
        applicationFields.rejectionFeedback,
        applicationFields.educationHistory,
        applicationFields["preferences.preferredCountries"],
        applicationFields["preferences.preferredFieldOfStudy"],
        applicationFields["preferences.preferredIntake"],
        applicationFields["financial_info.funding_source"],
        applicationFields["financial_info.budget_range_usd"],
      ];

    case "update":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Application ID"),
        ...Object.values(applicationFields),
      ];

    case "getOne":
    case "delete":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Application ID"),
      ];

    case "getMany":
      return [
        query("user").optional().custom((v) => isMongoId(v) || "Invalid User ID"),
        query("agent").optional().custom((v) => isMongoId(v) || "Invalid Agent ID"),
        query("status").optional().isIn(["draft","submitted","accepted","approved","rejected"]),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
