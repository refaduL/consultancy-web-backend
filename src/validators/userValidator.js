const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isMongoId = (v) => mongoose.Types.ObjectId.isValid(v);

// ---------- Shared Field Rules ----------
const userFields = {
  first_name: body("first_name")
    .optional()
    .trim()
    .notEmpty().withMessage("First name cannot be empty")
    .isLength({ max: 31 }).withMessage("First name max 31 chars"),

  last_name: body("last_name")
    .optional()
    .trim(),

  email: body("email")
    .optional()
    .trim()
    .notEmpty().withMessage("Email cannot be empty")
    .isEmail().withMessage("Invalid email format"),

  password: body("password")
    .optional()
    .notEmpty().withMessage("Password cannot be empty")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 chars")
    .isLength({ max: 31 }).withMessage("Password max 31 chars"),

  phone: body("phone")
    .optional()
    .trim()
    .notEmpty().withMessage("Phone number cannot be empty"),

  date_of_birth: body("date_of_birth")
    .optional()
    .notEmpty().withMessage("Date of birth is required")
    .isISO8601().withMessage("Invalid date format"),

  gender: body("gender")
    .optional()
    .notEmpty().withMessage("Gender cannot be empty")
    .isIn(["Male", "Female", "Other"]).withMessage("Invalid gender value"),

  nationality: body("nationality")
    .optional()
    .trim()
    .notEmpty().withMessage("Nationality cannot be empty"),

  country_of_residence: body("country_of_residence")
    .optional()
    .trim()
    .notEmpty().withMessage("Country of residence cannot be empty"),

  address: body("address").optional().trim(),
  city: body("city").optional().trim(),
  country: body("country").optional().trim(),

  profile_picture_url: body("profile_picture_url")
    .optional()
    .isURL().withMessage("Invalid profile picture URL"),

  "social_links.linkedin": body("social_links.linkedin")
    .optional()
    .trim()
    .isURL().withMessage("LinkedIn must be a valid URL"),

  "social_links.portfolio": body("social_links.portfolio")
    .optional()
    .trim()
    .isURL().withMessage("Portfolio must be a valid URL"),

  role: body("role")
    .optional()
    .notEmpty().withMessage("Role ID cannot be empty")
    .custom((v) => isMongoId(v) || "Invalid Role ID"),

  agent_profile: body("agent_profile")
    .optional()
    .custom((v) => !v || isMongoId(v) || "Invalid Agent ID"),

  application: body("application")
    .optional()
    .custom((v) => !v || isMongoId(v) || "Invalid Application ID"),
};

// ----------------------------------------

exports.validateUser = (mode) => {
  switch (mode) {
    case "create":
      return [
        userFields.first_name.notEmpty().withMessage("First name is required"),
        userFields.email.notEmpty().withMessage("Email is required"),
        userFields.password.notEmpty().withMessage("Password is required"),
        userFields.phone.notEmpty().withMessage("Phone number is required"),
        userFields.date_of_birth.notEmpty().withMessage("Date of birth is required"),
        userFields.gender.notEmpty().withMessage("Gender is required"),
        userFields.nationality.notEmpty().withMessage("Nationality is required"),
        userFields.country_of_residence.notEmpty().withMessage("Country of residence is required"),
        userFields.role.notEmpty().withMessage("Role ID is required"),

        // Optional but validated fields
        userFields.last_name,
        userFields.address,
        userFields.city,
        userFields.country,
        userFields.profile_picture_url,
        userFields["social_links.linkedin"],
        userFields["social_links.portfolio"],
        userFields.agent_profile,
        userFields.application,
      ];

    case "update":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid User ID"),
        ...Object.values(userFields),
      ];

    case "delete":
    case "getOne":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid User ID"),
      ];

    case "getMany":
      return [
        query("search").optional().trim(),
        query("gender").optional().isIn(["Male", "Female", "Other"]),
        query("role").optional().custom((v) => isMongoId(v) || "Invalid Role ID"),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
