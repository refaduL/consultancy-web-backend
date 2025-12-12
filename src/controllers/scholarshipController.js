const {
  successResponse,
} = require("./responseController");
const createError = require("http-errors");
const {
  findAllScholarships,
  findScholarshipById,
  createScholarship,
  updateScholarship,
  deleteScholarship,
} = require("../services/scholarshipService");

/**
 * GET /api/scholarships
 * Public: Get all scholarships with filtering and pagination
 * Query params: search, university_id, program_id, is_active, upcoming_deadline, page, limit
 */
const handleGetScholarships = async (req, res, next) => {
  try {
    // Sanitize inputs
    const search = req.query.search ? String(req.query.search).trim() : "";
    const university_id = req.query.university_id
      ? String(req.query.university_id).trim()
      : "";
    const program_id = req.query.program_id
      ? String(req.query.program_id).trim()
      : "";
    const is_active =
      req.query.is_active !== undefined ? req.query.is_active : null;
    const upcoming_deadline =
      req.query.upcoming_deadline !== undefined
        ? req.query.upcoming_deadline
        : false;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { scholarships, pagination } = await findAllScholarships(
      search,
      university_id,
      program_id,
      is_active,
      upcoming_deadline,
      page,
      limit
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Scholarships fetched successfully",
      payload: { scholarships, pagination },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/scholarships/:id
 * Public: Get single scholarship by ID
 */
const handleGetScholarshipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scholarship = await findScholarshipById(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Scholarship fetched successfully",
      payload: { scholarship },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/scholarships
 * Admin/Agent: Create new scholarship
 */
const handleCreateScholarship = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const scholarship = await createScholarship(req.body);

    return successResponse(res, {
      statusCode: 201,
      message: "Scholarship created successfully",
      payload: { scholarship },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/scholarships/:id
 * Admin/Agent: Update scholarship
 */
const handleUpdateScholarship = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const scholarship = await updateScholarship(id, req.body);

    return successResponse(res, {
      statusCode: 200,
      message: "Scholarship updated successfully",
      payload: { scholarship },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/scholarships/:id
 * Admin/Agent: Delete scholarship
 */
const handleDeleteScholarship = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteScholarship(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Scholarship deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetScholarships,
  handleGetScholarshipById,
  handleCreateScholarship,
  handleUpdateScholarship,
  handleDeleteScholarship,
};
