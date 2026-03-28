const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const rateLimit = require("express-rate-limit");
const path = require("path");

const seedRouter = require("./routes/seedRouter");
const userRouter = require("./routes/userRouter");
const authRouter = require("./routes/authRouter");
const programRouter = require("./routes/programRouter");
const courseRouter = require("./routes/courseRouter");
const scholarshipRouter = require("./routes/scholarshipRouter");
const universityRouter = require("./routes/universityRouter");
const applicationRouter = require("./routes/applicationRouter");
const documentRouter = require("./routes/documentRouter");

const dbErrorHandler = require("./utils/dbErrorHandler");
const { getDefaultErrorCode, getErrorDetails } = require("./utils/errorUtils");
const { errorResponse } = require("./controllers/responseController");
const { clientURL } = require("./secret");

const app = express();

app.use(cors({
  origin: clientURL, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: "Too many request from this IP. Please try again later",
});

app.use(rateLimiter);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve application uploads as static files
app.use(
  "/uploads/applications",
  express.static(path.join(__dirname, "../uploads/applications"))
);

app.get("/test", (req, res) => {
  res.status(200).send({ message: "get: api is working fine" });
});

app.use("/api/seed", seedRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/documents", documentRouter);
app.use("/api/universities", universityRouter);
app.use("/api/programs", programRouter);
app.use("/api/courses", courseRouter);
app.use("/api/scholarships", scholarshipRouter);

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
    message: err.message || "Internal Server Error",
    code: err.code || getDefaultErrorCode(err.status || 500),
    details: err.details || getErrorDetails(err, err.status || 500),
    originalError: err,
    path: err.path || req.originalUrl,
  };

  return errorResponse(res, errorInfo);
});

module.exports = app;
