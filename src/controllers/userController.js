const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const createError = require("http-errors");

const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const { findWithId } = require("../services/findItem");
const { createJSONWebToken } = require("../helper/jsonwebtoken");
const { deleteImage } = require("../helper/deleteImage");
const emailWithNodeMailer = require("../helper/email");
const { jwtActivationKey, clientURL } = require("../secret");
const {
  handleUserAction,
  findUsers,
  findUserById,
  deleteUserById,
  updateUserById,
  updateUserPasswordById,
} = require("../services/userService");

const getUsers = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const { users, pagination } = await findUsers(search, page, limit);

    // res.status(200).send({
    //   message: "user returned succesfully",
    //   users: users,
    //   pagination: {
    //     totalPages: Math.ceil(count / limit),
    //     currentPage: page,
    //     previousPage: page - 1 > 0 ? page - 1 : null,
    //     nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
    //   },
    // });

    return successResponse(res, {
      statusCode: 200,
      message: "users returned succesfully",
      payload: {
        users,
        pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

const handleGetUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const options = { password: 0 };

    const user = await findUserById(id, options);

    return successResponse(res, {
      statusCode: 200,
      message: "User is found based on the ID",
      payload: { user },
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const options = { password: 0 };
    const user = await deleteUserById(id, options);

    return successResponse(res, {
      statusCode: 200,
      message: `User named ${user.name.toUpperCase()} is deleted from Database`,
      payload: { user },
    });
  } catch (error) {
    next(error);
  }
};

const processRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // image as Buffer
    // const image = req.file;
    // if (!image) {
    //   throw createError(400, "Image file is required");
    // }
    // if (image.size > 1024 * 1024 * 2) {
    //   throw createError(400, "Image file too large. Must be less than 2MB");
    // }

    // const imageBufferString = image.buffer.toString("base64");

    // const newUser = { name, email, password, phone, address, image: imageBufferString};
    // if (image) newUser.image = imageBufferString;

    console.log("REVOLOPER: image storing as String");
    // image as String
    const image = req.file?.path;
    if (image && image.size > 1024 * 1024 * 2) {
      throw createError(400, "Image file too large. Must be less than 2MB");
    }
    const newUser = { name, email, password, phone, address };
    if (image) newUser.image = image;

    const userExists = await User.exists({ email: email });
    if (userExists) {
      throw createError(409, "User email already exists. Please Sign in");
    }

    const token = createJSONWebToken(newUser, jwtActivationKey, "10m");

    // prepare email
    const emailData = {
      email,
      subject: "Account Verification Email",
      html: `
            <h2>Hello ${name} !</h2>
            <p>Please click here to  <a href="${clientURL}/api/users/activate/${token}" target="_blank">Verify Your Email</a> and Activate your account </p>
          `,
    };

    //  email using nodemailer
    try {
      await emailWithNodeMailer(emailData);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
      return;
    }

    return successResponse(res, {
      statusCode: 200,
      message: `Please check your email(${email}) for completing reg process`,
      payload: { token },
    });
  } catch (error) {
    next(error);
  }
};

const activateUserAccount = async (req, res, next) => {
  try {
    const token = req.body.token;
    if (!token) throw createError(404, "Token not found");

    try {
      const decoded = jwt.verify(token, jwtActivationKey);
      if (!decoded) throw createError(401, "User was not able to be verified");

      const userExists = await User.exists({ email: decoded.email });
      if (userExists) {
        console.log("User exists alreadyyyyyyyyyy");
        console.log(decoded);
        throw createError(409, "User email already exists. Please Sign in");
      }

      const newUser = await User.create(decoded);

      return successResponse(res, {
        statusCode: 201,
        message: `User was registered successfully`,
        payload: { newUser },
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw createError(401, "Token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw createError(401, "Invalid token");
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

const handleUpdateUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updatedUser = await updateUserById(userId, req);

    return successResponse(res, {
      statusCode: 200,
      message: "User is updated successfully",
      payload: { updatedUser },
    });
  } catch (error) {
    next(error);
  }
  // when trying to update the email, error handling does not work
};

const handleUpdatePassword = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { email, oldPassword, newPassword, confirmedPassword } = req.body;

    // isExist?, compare the password, update user info
    const updatedUser = await updateUserPasswordById(
      userId,
      email,
      oldPassword,
      newPassword,
      confirmedPassword,
      req
    );

    return successResponse(res, {
      statusCode: 200,
      message: "User password updated successfully",
      payload: { updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const handleManageUserStatusById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const action = req.body.action;

    const successMessage = await handleUserAction(userId, action);

    return successResponse(res, {
      statusCode: 200,
      message: successMessage,
      payload: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  handleGetUserById,
  handleDeleteUserById,
  processRegister,
  activateUserAccount,
  handleUpdateUserById,
  handleUpdatePassword,
  handleManageUserStatusById,
};
