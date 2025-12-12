const Course = require("../models/courseModel");
const Program = require("../models/programModel");
const createError = require("http-errors");
const mongoose = require("mongoose");

/**
 * Helper: Escape special characters for Regex to prevent crashes/injection
 */
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * GET ALL COURSES (With Filtering & Pagination)
 * @param {string} search - Search term
 * @param {string} program_id - Filter by program ID
 * @param {boolean} is_elective - Filter by course type (true = elective, false = core)
 * @param {number} semester - Filter by semester number
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} { courses, pagination }
 */
const findAllCourses = async (search = "", program_id = "", is_elective = null, semester = null, page = 1, limit = 10) => {
  const filter = {};

  // Validate pagination inputs
  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Math.min(Number(limit), 100));

  // Search filter
  if (search) {
    const safeSearch = escapeRegex(search.trim());
    const searchRegExp = new RegExp(".*" + safeSearch + ".*", "i");
    filter.$or = [
      { course_name: { $regex: searchRegExp } },
      { course_code: { $regex: searchRegExp } },
      { description: { $regex: searchRegExp } },
    ];
  }

  // Filter by program
  if (program_id) {
    if (!mongoose.Types.ObjectId.isValid(program_id)) {
      throw createError(400, "Invalid Program ID format");
    }
    filter.program = program_id;
  }

  // Filter by course type (elective vs core)
  if (is_elective !== null && is_elective !== undefined) {
    filter.is_elective = is_elective === true || is_elective === "true";
  }

  // Filter by semester
  if (semester !== null && semester !== undefined) {
    filter.semester = Number(semester);
  }

  const courses = await Course.find(filter)
    .populate("program", "program_name degree_level field_of_study university")
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ semester: 1, course_name: 1 })
    .lean(); // Return plain JS objects for better performance

  const count = await Course.countDocuments(filter);

  return {
    courses,
    pagination: {
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
      previousPage: pageNumber - 1 > 0 ? pageNumber - 1 : null,
      nextPage: pageNumber + 1 <= Math.ceil(count / limitNumber) ? pageNumber + 1 : null,
      totalCourses: count,
    },
  };
};

/**
 * GET SINGLE COURSE BY ID
 * @param {string} id - Course ID
 * @returns {Object} Course document with populated program
 */
const findCourseById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Course ID format");
  }

  const course = await Course.findById(id).populate("program");

  if (!course) throw createError(404, "Course not found");

  return course;
};


/**
 * CREATE COURSE
 * @param {Object} courseInfo - Course data
 * @returns {Object} Created course document
 */

const createCourse = async (courseInfo) => {
  // Validate required fields
  if (!courseInfo.course_name) {
    throw createError(400, "Course name is required");
  }

  if (!courseInfo.program) {
    throw createError(400, "Program ID is required");
  }

  // Validate program ID format
  if (!mongoose.Types.ObjectId.isValid(courseInfo.program)) {
    throw createError(400, "Invalid Program ID format");
  }

  // Verify program exists
  const programExists = await Program.findById(courseInfo.program);
  if (!programExists) {
    throw createError(404, "Program not found. Cannot create course for non-existent program.");
  }

  // Check for duplicate course name within the same program
  const duplicateCourse = await Course.findOne({
    program: courseInfo.program,
    course_name: courseInfo.course_name.trim(),
  });

  if (duplicateCourse) {
    throw createError(409, "Course with this name already exists in this program");
  }

  return await Course.create(courseInfo);
};


/**
 * UPDATE COURSE
 * @param {string} id - Course ID
 * @param {Object} data - Update data
 * @returns {Object} Updated course document
 */

const updateCourse = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Course ID format");
  }

  // If updating program, verify new program exists
  if (data.program) {
    if (!mongoose.Types.ObjectId.isValid(data.program)) {
      throw createError(400, "Invalid Program ID format");
    }
    const programExists = await Program.findById(data.program);
    if (!programExists) {
      throw createError(404, "Program not found");
    }
  }

  // If updating course name, check for duplicates within the same program
  if (data.course_name) {
    const course = await Course.findById(id);
    if (!course) {
      throw createError(404, "Course not found");
    }

    const programId = data.program || course.program;
    const nameExists = await Course.findOne({
      course_name: data.course_name.trim(),
      program: programId,
      _id: { $ne: id }, // Exclude current course
    });

    if (nameExists) {
      throw createError(409, "Course name already exists in this program");
    }
  }

  const course = await Course.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!course) throw createError(404, "Course not found");

  return course;
};

/**
 * DELETE COURSE
 * @param {string} id - Course ID
 * @returns {Object} Deleted course document
 */
const deleteCourse = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Course ID format");
  }

  const course = await Course.findByIdAndDelete(id);

  if (!course) throw createError(404, "Course not found");

  return course;
};

module.exports = {
  findAllCourses,
  findCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};

