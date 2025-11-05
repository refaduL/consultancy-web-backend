const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const { jwtAccessKey } = require("../secret");
const { createJSONWebToken } = require("../helper/jsonwebtoken");

const handleLogin = async (req, res, next) => {
  try {
    // exracting email pass from req.body
    const { email, password } = req.body;

    // isExist?
    const user = await User.findOne({ email });
    if (!user) {
      throw createError(
        404,
        "User doesn't exist with this Email. Please register first. "
      );
    }
    // compare the password
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      throw createError(401, "User email/password doesn't match.");
    }
    // isBanned?
    const isBanned = user.isBanned;
    if (isBanned) {
      throw createError( 403, "User is banned for a reason. Please contact authority" );
    }

    // generate token (cookie)
    const accessToken = createJSONWebToken({ user }, jwtAccessKey, "15m");

    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    const userWithoutPassword = await User.findOne({ email }).select('-password');
    return successResponse(res, {
      statusCode: 200,
      message: `User logged in successfully`,
      payload: { userWithoutPassword },
    });
  } catch (error) {
    next(error);
  }
};

const handleLogout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");

    return successResponse(res, {
      statusCode: 200,
      message: `User logged out successfully`,
      payload: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleLogin, handleLogout };
