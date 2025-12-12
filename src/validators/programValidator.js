const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// Shared field rules
const programFields = {
  university: body("university")
    .optional()
    .notEmpty().withMessage("University ID cannot be empty")
    .custom((v) => isMongoId(v) || "Invalid University ID"),

  program_name: body("program_name")
    .optional()
    .trim()
    .notEmpty().withMessage("Program name cannot be empty"),

  degree_level: body("degree_level")
    .optional()
    .isIn(["Bachelor's","Master's","PhD","Diploma","Certificate","Associate"])
    .withMessage("Invalid degree level"),

  field_of_study: body("field_of_study")
    .optional()
    .trim()
    .notEmpty().withMessage("Field of study cannot be empty"),

  study_mode: body("study_mode")
    .optional()
    .isIn(['Full-time','Part-time','Online','Hybrid'])
    .withMessage("Invalid study mode"),

  language_of_instruction: body("language_of_instruction")
    .optional()
    .isArray().withMessage("Language of instruction must be an array of strings")
    .custom(arr => arr.every(lang => typeof lang === "string"))
    .withMessage("Each language must be a string"),

  description: body("description")
    .optional()
    .trim(),

  career_prospects: body("career_prospects")
    .optional()
    .trim(),

  duration: body("duration")
    .optional()
    .trim()
    .notEmpty().withMessage("Duration cannot be empty"),

  tuition_fee: body("tuition_fee")
    .optional()
    .isFloat({ min: 0 }).withMessage("Tuition fee must be a positive number"),

  tuition_fee_type: body("tuition_fee_type")
    .optional()
    .isIn(['Per Year','Per Semester','Total Program Fee','Per Credit'])
    .withMessage("Invalid tuition fee type"),

  currency: body("currency")
    .optional()
    .trim(),

  program_url: body("program_url")
    .optional()
    .trim(),

  requirements: body("requirements")
    .optional()
    .custom(req => typeof req === "object")
    .withMessage("Requirements must be an object"),

  intakes: body("intakes")
    .optional()
    .isArray().withMessage("Intakes must be an array"),
};

// Dynamic validator
exports.validateProgram = (mode) => {
  switch (mode) {
    case "create":
      return [
        programFields.university.notEmpty().withMessage("University ID is required"),
        programFields.program_name.notEmpty().withMessage("Program name is required"),
        programFields.degree_level.notEmpty().withMessage("Degree level is required"),
        programFields.field_of_study.notEmpty().withMessage("Field of study is required"),
        programFields.duration.notEmpty().withMessage("Duration is required"),
        programFields.study_mode,
        programFields.language_of_instruction,
        programFields.description,
        programFields.career_prospects,
        programFields.tuition_fee,
        programFields.tuition_fee_type,
        programFields.currency,
        programFields.program_url,
        programFields.requirements,
        programFields.intakes,
      ];

    case "update":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Program ID"),
        ...Object.values(programFields),
      ];

    case "getOne":
    case "delete":
      return [
        param("id").custom((v) => isMongoId(v) || "Invalid Program ID"),
      ];

    case "getMany":
      return [
        query("university").optional().custom((v) => isMongoId(v) || "Invalid University ID"),
        query("degree_level").optional().isIn(["Bachelor's","Master's","PhD","Diploma","Certificate","Associate"]),
        query("field_of_study").optional().trim(),
        query("study_mode").optional().isIn(['Full-time','Part-time','Online','Hybrid']),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
