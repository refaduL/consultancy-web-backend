const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// Shared field rules
const universityFields = {
  name: body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("University name cannot be empty"),

  native_name: body("native_name").optional().trim(),

  type: body("type")
    .optional()
    .isIn(["Public", "Private", "Semi-Private"])
    .withMessage("Type must be one of: Public, Private, Semi-Private"),

  established_year: body("established_year")
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage("Established year must be a valid year"),

  city: body("city")
    .optional()
    .trim()
    .notEmpty().withMessage("City cannot be empty"),

  country: body("country")
    .optional()
    .trim()
    .notEmpty().withMessage("Country cannot be empty"),

  description: body("description").optional().trim(),

  website_url: body("website_url").optional().trim(),

  logo_url: body("logo_url").optional().trim(),

  gallery: body("gallery").optional().isArray().withMessage("Gallery must be an array of image URLs"),

  rankings_qs: body("rankings.qs").optional().isNumeric().withMessage("QS ranking must be a number"),
  rankings_times: body("rankings.times").optional().isNumeric().withMessage("Times ranking must be a number"),
  rankings_us_news: body("rankings.us_news").optional().isNumeric().withMessage("US News ranking must be a number"),

  contact_email: body("contact_info.email").optional().isEmail().withMessage("Email must be valid"),
  contact_phone: body("contact_info.phone").optional().trim(),
  contact_address: body("contact_info.address").optional().trim(),

  general_application_info: body("general_application_info").optional().trim(),

  facilities: body("facilities").optional().isArray().withMessage("Facilities must be an array of strings"),
};

// Dynamic validator
exports.validateUniversity = (mode) => {
  switch (mode) {
    case "create":
      return [
        universityFields.name.notEmpty().withMessage("University name is required"),
        universityFields.city.notEmpty().withMessage("City is required"),
        universityFields.country.notEmpty().withMessage("Country is required"),
        ...Object.values(universityFields),
      ];

    case "update":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid University ID"),
        ...Object.values(universityFields),
      ];

    case "getOne":
    case "delete":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid University ID"),
      ];

    case "getMany":
      return [
        query("name").optional().trim(),
        query("city").optional().trim(),
        query("country").optional().trim(),
        query("type").optional().isIn(["Public", "Private", "Semi-Private"]),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
