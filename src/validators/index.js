const { validationResult } = require("express-validator");
const { errorResponse } = require("../controllers/responseController");

const runValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return errorResponse(res, {
      statusCode: 422,
      message: "Validation Failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = { runValidation };
