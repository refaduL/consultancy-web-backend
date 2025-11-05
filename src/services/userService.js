const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const createError = require("http-errors");

const User = require("../models/userModel");
const { deleteImage } = require("../helper/deleteImage");

const findUsers = async (search, page, limit) => {
  try {
    const searchRegEx = new RegExp(".*" + search + ".*", "i");
    const filter = {
      isAdmin: { $ne: true },
      $or: [
        { name: { $regex: searchRegEx } },
        { email: { $regex: searchRegEx } },
        { phone: { $regex: searchRegEx } },
      ],
    };
    const options = { password: 0 };

    const users = await User.find(filter, options)
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await User.find(filter).countDocuments();

    if (!users || users.length === 0)
      throw createError(404, "nooo users found");

    return {
      users,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
    };
  } catch (error) {
    throw error;
  }
};

const findUserById = async (id, options = {}) => {
  try {
    const user = await User.findById(id, options);
    if (!user) {
      throw createError(404, `User doesn't exist with this id: ${id}`);
    }
    return user;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      throw createError(400, "Invalid user ID");
    }
    throw error;
  }
};

const deleteUserById = async (id, options = {}) => {
  try {
    const user = await User.findByIdAndDelete({ _id: id, isAdmin: false });
    if (user && user.image) {
      await deleteImage(user.image);
    }
    return user;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      throw createError(400, "Invalid user ID");
    }
    throw error;
  }
};

const updateUserById = async (userId, req) => {
  try {
    const options = { password: 0 };
    const user = await findUserById(userId, options);

    const updateOptions = { new: true, runValidators: true, context: "query" };
    let updates = {};

    const allowedFields = ["name", "password", "phone", "address"];
    for (const key in req.body) {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      } else if (["email"].includes(key)) {
        throw createError(400, "Sorry, You can't change the email");
      }
    }

    // const image = req.file.path;                         // image as buffer
    const image = req.file;                                 // image as String
    if (image) {
      if (image.size > 1024 * 1024 * 2) {
        throw createError(400, "File too large. It must be less than 2 MB");
      }
      // updates.image = image.buffer.toString("base64");  // image as buffer
      updates.image = image;                               // image as String
      user.image !== "default.jpg" && deleteImage(user.image);
    }

    // update user info;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      updateOptions
    ).select("-password");

    if (!updatedUser) {
      throw createError(404, "User with this id doesn't exist");
    }
    return updatedUser;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      throw createError(400, "Invalid ID");
    }
    throw error;
  }
};

const updateUserPasswordById = async (userId, email, oldPassword, newPassword, confirmedPassword, req) => {
  try {
    // isExist ?
    const user = await User.findOne({ email });

    if (!user) {
      throw createError(400, "User is not found with this email.");
    }

    if (newPassword !== confirmedPassword) {
      throw createError(
        400,
        "ConfirmedPassword doesn't match with NewPassword."
      );
    }
    // compare the password
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatched) {
      throw createError(400, "Current Password doesn't match.");
    }

    const filter = { userId };
    const update = { $set: { password: newPassword } };
    const updateOptions = { new: true };

    // update user info;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      update,
      updateOptions
    ).select("-password");

    if (!updatedUser) {
      throw createError(404, "User cannot update successfully");
    }
    return updatedUser;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      throw createError(400, "Invalid ID");
    }
    throw error;
  }
};

const handleUserAction = async (userId, action) => {
  try {
    let update, successMessage;
    if (action === "ban") {
      update = { isBanned: true };
      successMessage = "User is banned successfully";
    } else if (action === "unban") {
      update = { isBanned: false };
      successMessage = "User is unbanned successfully";
    } else {
      throw createError(400, "Invalid action. Use 'ban' or 'unban'.");
    }

    const updateOptions = { new: true, runValidators: true, context: "query" };
    // update user info
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      update,
      updateOptions
    ).select("-password");

    if (!updatedUser) {
      throw createError(400, `User ${action} unsuccessful`);
    }
    return successMessage;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      throw createError(400, "Invalid ID");
    }
    throw error;
  }
};

module.exports = {
  findUsers,
  findUserById,
  deleteUserById,
  updateUserById,
  updateUserPasswordById,
  handleUserAction,
};
