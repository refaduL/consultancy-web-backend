const fs = require("fs");
const mongoose = require("mongoose");
const createError = require("http-errors");
const { successResponse } = require("./responseController");
const { findUsers, findUserById, deleteUserById, updateUserById, updateUserPasswordById } = require("../services/userService");


/**
 * GET ALL USERS (Agent, Admin)
 * Uses the service for pagination and search
 */
const getUsers = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const { users, pagination } = await findUsers(search, page, limit);

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

/**
 * GET ALL Agents (Admin)
 * Uses the service for pagination and search
 */

const getAgents = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const { users, pagination } = await findUsers(search, page, limit,);
    const filteredAgents = users.filter(user => user.role.role_name === 'agent');

    return successResponse(res, {
      statusCode: 200,
      message: "agents returned succesfully",
      payload: {
        filteredAgents,
        pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET SINGLE USER BY ID
 */
const handleGetUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const options = { password: 0 };

    const user = await findUserById(id, options);

    return successResponse(res, {
      statusCode: 200,
      message: "User found successfully",
      payload: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE USER (Admin Only)
 */
const handleDeleteUserById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const user = await deleteUserById(id);
    if (!user) throw createError(404, "User not found");

    return successResponse(res, {
      statusCode: 200,
      message: `User named ${user.first_name.toUpperCase()} is deleted from Database`,
      payload: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE USER PROFILE
 * Handles updating optional fields and profile picture.
 */
const handleUpdateUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Security Check
    if (req.user.role.role_name !== 'admin' && req.user._id.toString() !== userId) {
        throw createError(403, "Access denied. You can only update your own profile.");
    }

    const updatedUser = await updateUserById(userId, req);

    return successResponse(res, {
      statusCode: 200,
      message: "User is updated successfully",
      payload: { updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE PASSWORD 
 */
const handleUpdatePassword = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { email, oldPassword, newPassword, confirmedPassword } = req.body;

    // isExist?
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


module.exports = {
  getUsers,
  getAgents,
  handleGetUserById,
  handleDeleteUserById,
  handleUpdateUserById,
  handleUpdatePassword,
};
