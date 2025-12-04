const {
  successResponse,
} = require("./responseController");
const createError = require("http-errors");
const {
  findAllUniversities,
  findUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} = require("../services/universityService");

/**
 * GET /api/universities
 */
const handleGetUniversities = async (req, res, next) => {
  try {
    // Sanitize inputs
    const search = req.query.search ? String(req.query.search).trim() : "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { universities, pagination } = await findAllUniversities(
      search,
      page,
      limit
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Universities fetched successfully",
      payload: { universities, pagination },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/universities/:id
 */
const handleGetUniversityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const university = await findUniversityById(id);

    return successResponse(res, {
      statusCode: 200,
      message: "University fetched successfully",
      payload: { university },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/universities
 */
const handleCreateUniversity = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const university = await createUniversity(req.body);

    return successResponse(res, {
      statusCode: 201,
      message: "University created successfully",
      payload: { university },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/universities/:id
 */
const handleUpdateUniversity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const university = await updateUniversity(id, req.body);

    return successResponse(res, {
      statusCode: 200,
      message: "University updated successfully",
      payload: { university },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/universities/:id
 */
const handleDeleteUniversity = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteUniversity(id);

    return successResponse(res, {
      statusCode: 200,
      message: "University deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetUniversities,
  handleGetUniversityById,
  handleCreateUniversity,
  handleUpdateUniversity,
  handleDeleteUniversity,
};
