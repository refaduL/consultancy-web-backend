// utils/errorUtils.js

/**
 * Get default error code based on HTTP status
 */
const getDefaultErrorCode = (statusCode) => {
  const codeMap = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_SERVER_ERROR",
    501: "NOT_IMPLEMENTED",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
  };

  return codeMap[statusCode] || "INTERNAL_ERROR";
};

/**
 * Extract meaningful details from different error types
 */
const getErrorDetails = (err, statusCode) => {
  const details = [];

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    Object.values(err.errors).forEach((error) => {
      details.push(error.message);
    });
    return details;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    details.push("Invalid authentication token");
  }
  if (err.name === "TokenExpiredError") {
    details.push("Authentication token expired");
  }

  // Cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    details.push(`Invalid ID format: ${err.value}`);
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    details.push(`${field} already exists`);
  }

  // Rate limiting
  if (statusCode === 429) {
    details.push("Too many requests, please try again later");
  }

  return details.length > 0 ? details : undefined;
};

module.exports = {
  getDefaultErrorCode,
  getErrorDetails,
};
