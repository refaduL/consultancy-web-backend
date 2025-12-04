const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const rateLimit = require("express-rate-limit");

const seedRouter = require("./routes/seedRouter");
const userRouter = require("./routes/userRouter");
const authRouter = require("./routes/authRouter");
const applicationRouter = require("./routes/applicationRouter");

const dbErrorHandler = require("./utils/dbErrorHandler");
const { getDefaultErrorCode, getErrorDetails } = require("./utils/errorUtils");
const { errorResponse } = require("./controllers/responseController");
const universityRouter = require("./routes/universityRouter");

const app = express();

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: "Too many request from this IP. Please try again later",
});

app.use(rateLimiter);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
  res.status(200).send({ message: "get: api is working fine" });
});

app.use("/api/seed", seedRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/universities", universityRouter);

// handle 404 error => route not found
app.use((req, res, next) => {
  next(createError(404, `route not found: ${req.originalUrl}`));
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  // Check if it's a database-related error
  if (dbErrorHandler.isDatabaseError(err)) {
    const dbError = dbErrorHandler(err);
    return errorResponse(res, {
      statusCode: dbError.statusCode,
      message: dbError.message,
      code: dbError.code,
      details: dbError.details,
      originalError: err,
      path: req.originalUrl,
    });
  }

  // For other errors, normalize and send response
  const errorInfo = {
    statusCode: err.status || 500,
    message: err.message || 'Internal Server Error',
    code: err.code || getDefaultErrorCode(err.status || 500),
    details: err.details || getErrorDetails(err, err.status || 500),
    originalError: err,
    path: err.path || req.originalUrl
  };

  return errorResponse(res, errorInfo);
});

module.exports = app;
