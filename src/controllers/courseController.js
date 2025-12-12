const { successResponse } = require("./responseController");
const createError = require("http-errors");
const {
  findAllCourses,
  findCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../services/courseService");

/**
 * GET /api/courses
 * Public: Get all courses with filtering and pagination
 * Query params: search, program_id, is_elective, semester, page, limit
 */
const handleGetCourses = async (req, res, next) => {
  try {
    // Sanitize inputs
    const search = req.query.search ? String(req.query.search).trim() : "";
    const program_id = req.query.program_id ? String(req.query.program_id).trim() : "";
    const is_elective = req.query.is_elective !== undefined ? req.query.is_elective === "true" : null;
    const semester = req.query.semester !== undefined ? Number(req.query.semester) : null;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { courses, pagination } = await findAllCourses(
      search,
      program_id,
      is_elective,
      semester,
      page,
      limit
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Courses fetched successfully",
      payload: { courses, pagination },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courses/:id
 * Public: Get single course by ID
 */
const handleGetCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await findCourseById(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Course fetched successfully",
      payload: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/courses
 * Admin/Agent: Create new course
 */
const handleCreateCourse = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const course = await createCourse(req.body);

    return successResponse(res, {
      statusCode: 201,
      message: "Course created successfully",
      payload: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/courses/:id
 * Admin/Agent: Update course
 */
const handleUpdateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const course = await updateCourse(id, req.body);

    return successResponse(res, {
      statusCode: 200,
      message: "Course updated successfully",
      payload: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/courses/:id
 * Admin/Agent: Delete course
 */
const handleDeleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteCourse(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetCourses,
  handleGetCourseById,
  handleCreateCourse,
  handleUpdateCourse,
  handleDeleteCourse,
};

