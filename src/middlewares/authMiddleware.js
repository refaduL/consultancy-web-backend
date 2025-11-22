const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { jwtAccessKey } = require("../secret");
const User = require("../models/userModel");

/**
 * check if the ID is a valid MongoDB ObjectId
 */

const validateObjectId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, "Invalid ID format");
    }
    next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware to check if user is logged in via JWT
 */
const isLoggedIn = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      throw createError(401, "Access token not found. Please login.");
    }

    const decoded = jwt.verify(accessToken, jwtAccessKey );
    if (!decoded) {
      throw createError(401, "Invalid access token. Please login again.");
    }

    const user = await User.findById(decoded.user._id)
      .select("-password")
      .populate("role");

    if (!user) {
      throw createError(401, "User belonging to this token no longer exists.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(createError(401, "Token expired. Please login again."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(createError(401, "Invalid token."));
    }
    next(error);
  }
};

/**
 * Middleware to check if user is logged out via JWT
 */
const isLoggedOut = async (req, res, next) => {
  try {
    // 1. is there access token?
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
      // 2. check if it is valid or not
      try {
        const decoded = jwt.verify(accessToken, jwtAccessKey);
        if (decoded) {
          throw createError(400, "User is already Logged in.");
        }
      } catch (error) {
        throw error;
      }
    }

    next();
  } catch (error) {
    return next(error);
  }
};


/**
 * Middleware to restrict access based on Role
 * Usage: authorize('admin', 'agent')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, "User not authenticated"));
    }

    // Check if user's role name is in the allowed list
    const userRole = req.user.role?.role_name;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(
        createError(
          403,
          `Access Denied. Role '${userRole || "unknown"}' is not authorized.`
        )
      );
    }

    next();
  };
};

module.exports = { isLoggedIn, isLoggedOut, authorize };
