const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const rateLimit = require("express-rate-limit");

const seedRouter = require("./routes/seedRouter");
const userRouter = require("./routes/userRouter");
const authRouter = require("./routes/authRouter");

const { errorResponse } = require("./controllers/responseController");

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

// client error handle
app.use((req, res, next) => {
  next(createError(404, `route not found: ${req.originalUrl}`));
});

// server error handling -> all error from any route will go through the this handler
app.use((err, req, res, next) => {
  return errorResponse(res, { statusCode: err.status, message: err.message });
});

module.exports = app;
