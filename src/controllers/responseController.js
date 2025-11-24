const getDefaultErrorCode = require("../utils/errorUtils");
const getLocalTimestamp = require("../helpers/localTimestamp");

const successResponse = (
  res,
  { statusCode = 200, message = "Successful Execution", payload = {} }
) => {
  return res.status(statusCode).json({
    success: true,
    message: message,
    payload,
  });
};

// const errorResponse = (
//   res,
//   { statusCode = 500, message = "Internal Server Error", code, details, originalError }
// ) => {
//   return res.status(statusCode).json({
//     success: false,
//     message: message,
//     ...(code && { code }),
//     ...(details && { details }),
//     ...(originalError && process.env.NODE_ENV === 'development' && { originalError })
//   });
// };

const errorResponse = (
  res,
  {
    statusCode = 500,
    message = "Internal Server Error",
    code,
    details,
    originalError,
    path,
    timestamp = getLocalTimestamp("bd"),
  } = {}
) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  // Security: Sanitize message for production
  let clientMessage = message;
  if (isProduction && statusCode >= 500) {
    clientMessage = "Something went wrong. Please try again later.";
  }

  // Base response structure
  const response = {
    success: false,
    message: clientMessage,
    timestamp,
    ...(code && { code }),
    ...(path && { path }),
    ...(details && {
      details: Array.isArray(details) ? details : [details],
    }),

    // Debug info: only in development
    ...(isDevelopment &&
      originalError && {
        debug: {
          originalMessage: message,
          ...(typeof originalError === "string"
            ? { error: originalError }
            : {
                error: originalError.message,
                // stack: originalError.stack,
                ...(originalError.code && { code: originalError.code }),
              }),
        },
      }),
  };

  // Log errors appropriately
  logError({
    statusCode,
    message,
    code,
    path,
    timestamp,
    originalError,
    isProduction,
  });

  return res.status(statusCode).json(response);
};

//  Structured error logging
const logError = ({
  statusCode,
  message,
  code,
  path,
  timestamp,
  originalError,
  isProduction,
}) => {
  const logEntry = { timestamp, statusCode, code, path, message };

  if (statusCode >= 500) {
    // Server errors - log with full context
    console.error("SERVER_ERROR:", {
      ...logEntry,
      ...(originalError && {
        stack: originalError.stack,
        originalMessage: originalError.message,
      }),
    });
  } else if (statusCode >= 400) {
    // Client errors - log as warning
    console.warn("CLIENT_ERROR:", logEntry);
  }

  // In production, you might want to send to monitoring service
  if (isProduction && statusCode >= 500) {
    // sendToMonitoringService(logEntry);
  }
};

// Pre-defined error factory methods

errorResponse.notFound = (
  res,
  message = "Resource not found",
  options = {}
) => {
  return errorResponse(res, {
    statusCode: 404,
    message,
    code: getDefaultErrorCode(404),
    ...options,
  });
};

errorResponse.validationError = (
  res,
  message = "Validation failed",
  details,
  options = {}
) => {
  return errorResponse(res, {
    statusCode: 400,
    message,
    code: getDefaultErrorCode(400),
    details,
    ...options,
  });
};

errorResponse.unauthorized = (
  res,
  message = "Unauthorized access",
  options = {}
) => {
  return errorResponse(res, {
    statusCode: 401,
    message,
    code: getDefaultErrorCode(401),
    ...options,
  });
};

errorResponse.internalError = (
  res,
  message = "Internal server error",
  originalError,
  options = {}
) => {
  return errorResponse(res, {
    statusCode: 500,
    message,
    code: getDefaultErrorCode(500),
    originalError,
    ...options,
  });
};

module.exports = { errorResponse, successResponse };
