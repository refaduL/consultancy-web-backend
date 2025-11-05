const mongoose = require("mongoose");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const { jwtAccessKey } = require("../secret");


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

const isLoggedIn = async (req, res, next) => {
  try {
    // is there access token?
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      throw createError(401, "Access token not found. Please Log in");
    }
    const decoded = jwt.verify(accessToken, jwtAccessKey);
    if (!decoded) {
      throw createError(401, "Invalid access token. Please login again");
    }
    req.user = decoded.user;
    next();
  } catch (error) {
    return next(error);
  }
};

const isLoggedOut = async (req, res, next) => {
  try {
    // is there access token
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
      // check: it is valid or not
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

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      throw createError(403, "Forbidden req. You must be an admin.");
    }
    next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { validateObjectId, isLoggedIn, isLoggedOut, isAdmin };
