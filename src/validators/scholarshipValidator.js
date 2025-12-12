const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// Shared field rules
const scholarshipFields = {
  scholarship_name: body("scholarship_name")
    .optional()
    .trim()
    .notEmpty().withMessage("Scholarship name cannot be empty"),

  university: body("university")
    .optional()
    .notEmpty().withMessage("University ID cannot be empty")
    .custom((v) => isMongoId(v) || "Invalid University ID"),

  program: body("program")
    .optional()
    .custom((v) => !v || isMongoId(v) || "Invalid Program ID"),

  description: body("description")
    .optional()
    .trim()
    .notEmpty().withMessage("Description cannot be empty"),

  amount: body("amount")
    .optional()
    .trim()
    .notEmpty().withMessage("Amount cannot be empty"),

  eligible_nationalities: body("eligible_nationalities")
    .optional()
    .isArray().withMessage("Eligible nationalities must be an array of strings"),

  eligibility_criteria: body("eligibility_criteria")
    .optional()
    .trim(),

  deadline: body("deadline")
    .optional()
    .isISO8601().toDate().withMessage("Deadline must be a valid date"),

  is_active: body("is_active")
    .optional()
    .isBoolean().withMessage("is_active must be true or false"),

  scholarship_url: body("scholarship_url")
    .optional()
    .trim(),
};

// Dynamic validator
exports.validateScholarship = (mode) => {
  switch (mode) {
    case "create":
      return [
        scholarshipFields.scholarship_name.notEmpty().withMessage("Scholarship name is required"),
        scholarshipFields.university.notEmpty().withMessage("University ID is required"),
        scholarshipFields.description.notEmpty().withMessage("Description is required"),
        scholarshipFields.amount.notEmpty().withMessage("Amount is required"),
        scholarshipFields.program,
        scholarshipFields.eligible_nationalities,
        scholarshipFields.eligibility_criteria,
        scholarshipFields.deadline,
        scholarshipFields.is_active,
        scholarshipFields.scholarship_url,
      ];

    case "update":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Scholarship ID"),
        ...Object.values(scholarshipFields),
      ];

    case "getOne":
    case "delete":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Scholarship ID"),
      ];

    case "getMany":
      return [
        query("university").optional().custom((v) => isMongoId(v) || "Invalid University ID"),
        query("program").optional().custom((v) => isMongoId(v) || "Invalid Program ID"),
        query("is_active").optional().isBoolean(),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
