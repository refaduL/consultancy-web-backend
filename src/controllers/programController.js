const { successResponse } = require("./responseController");
const createError = require("http-errors");
const {
  findAllPrograms,
  findProgramById,
  createProgram,
  updateProgram,
  deleteProgram
} = require("../services/programService");

/**
 * GET /api/programs
 * Public: Search and Filter Programs
 */
const handleGetPrograms = async (req, res, next) => {
  try {
    const { programs, pagination } = await findAllPrograms(req.query);

    return successResponse(res, {
      statusCode: 200,
      message: "Programs fetched successfully",
      payload: { programs, pagination },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/programs/:id
 * Public: Get Detailed Program Info
 */
const handleGetProgramById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const program = await findProgramById(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Program fetched successfully",
      payload: { program },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/programs
 * Admin: Create New Program
 */
const handleCreateProgram = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const program = await createProgram(req.body);

    return successResponse(res, {
      statusCode: 201,
      message: "Program created successfully",
      payload: { program },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/programs/:id
 * Admin: Update Program
 */
const handleUpdateProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      throw createError(400, "Request body cannot be empty");
    }

    const program = await updateProgram(id, req.body);

    return successResponse(res, {
      statusCode: 200,
      message: "Program updated successfully",
      payload: { program },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/programs/:id
 * Admin: Delete Program
 */
const handleDeleteProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteProgram(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Program deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetPrograms,
  handleGetProgramById,
  handleCreateProgram,
  handleUpdateProgram,
  handleDeleteProgram
};