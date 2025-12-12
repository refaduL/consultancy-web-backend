const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

// Rules for course fields
const courseFields = {
  course_name: body("course_name")
    .optional()
    .notEmpty().withMessage("Course name cannot be empty")
    .trim()
    .escape(),

  course_code: body("course_code")
    .optional()
    .trim()
    .escape(),

  program: body("program")
    .optional()
    .notEmpty().withMessage("Program ID cannot be empty")
    .custom((value) => isMongoId(value) || "Invalid Program ID"),

  is_elective: body("is_elective")
    .optional()
    .isBoolean().withMessage("is_elective must be true or false"),

  semester: body("semester")
    .optional()
    .isInt({ min: 1 }).withMessage("Semester must be a positive number"),

  description: body("description")
    .optional()
    .trim()
    .escape(),
};

exports.validateCourse = (mode) => {
  switch (mode) {
    case "create":
      // Required fields enforced for creation
      return [
        courseFields.course_name.notEmpty().withMessage("Course name is required"),
        courseFields.program.notEmpty().withMessage("Program ID is required"),
        courseFields.course_code,
        courseFields.is_elective,
        courseFields.semester,
        courseFields.description,
      ];

    case "update":
      // Optional fields, but validated if present
      return [
        param("id").custom((value) => isMongoId(value) || "Invalid Course ID"),
        ...Object.values(courseFields),
      ];

    case "delete":
    case "getOne":
      return [
        param("id").custom((value) => isMongoId(value) || "Invalid Course ID"),
      ];

    case "getMany":
      return [
        query("search").optional().trim().escape(),
        query("program_id")
          .optional()
          .custom((value) => isMongoId(value) || "Invalid Program ID"),
        query("semester").optional().isInt({ min: 1 }),
        query("is_elective").optional().isBoolean(),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
      ];

    default:
      return [];
  }
};
