const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const createError = require("http-errors");

const User = require("../models/userModel");
const { deleteImage } = require("../helper/deleteImage");

const findUsers = async (search = "", page = 1, limit = 5) => {
  const searchRegExp = new RegExp(".*" + search + ".*", "i");
  
  const filter = {
    $or: [
      { first_name: { $regex: searchRegExp } },
      { last_name: { $regex: searchRegExp } },
      { email: { $regex: searchRegExp } },
      { phone: { $regex: searchRegExp } },
    ],
  };

  const users = await User.find(filter)
    .limit(limit)
    .skip((page - 1) * limit)
    .select("-password")
    .populate("role")
    .sort({ createdAt: -1 });
  
  if (!users || users.length === 0)
      throw createError(404, "no user found");

  const count = await User.find(filter).countDocuments();

  return {
    users,
    pagination: {
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previousPage: page - 1 > 0 ? page - 1 : null,
      nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      totalUsers: count
    },
  };
};

const findUserById = async (id, options = {}) => {
  try {
    const user = await User.findById(id, options)
    .populate("role")
    .populate("agent_profile"); // If they are an agent, show profile
    console.log("Found user:", user);
    if (!user) {
      throw createError(404, `User not found with id: ${id}`);
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
    const user = await User.findByIdAndDelete({ _id: id, ...options });
    console.log("Deleted user:", user);
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
    const user = await findUserById(userId);

    const updateOptions = { new: true, runValidators: true, context: "query" };
    let updates = {};

    // 1. Handle Image Upload (if file exists)
    const image = req.file;
    if (image) {
      // Size check (2MB)
      if (image.size > 1024 * 1024 * 2) {
        throw createError(400, "Image file too large. Must be less than 2MB");
      }
      
      // Delete old image if it's not the default one
      // Assuming user.profile_picture_url stores the path or filename
      if (user.profile_picture_url && !user.profile_picture_url.includes("default")) {
          try {
             // Check if file exists before trying to delete
             // Logic depends on how you store paths (absolute vs relative)
             // This is a placeholder for your delete logic
             // await fs.unlink(user.profile_picture_url); 
          } catch (err) {
              console.error("Failed to delete old image:", err.message);
          }
      }
      
      // Update path in updateData
      updates.profile_picture_url = image.path;
    }

    // // const image = req.file.path;                         // image as buffer
    // const image = req.file;                                 // image as String
    // if (image) {
    //   if (image.size > 1024 * 1024 * 2) {
    //     throw createError(400, "File too large. It must be less than 2 MB");
    //   }
    //   // updates.image = image.buffer.toString("base64");  // image as buffer
    //   updates.image = image;                               // image as String
    //   user.image !== "default.jpg" && deleteImage(user.image);
    // } 

    // 2. Handle Field Updates
    // We specify allowed fields to prevent users from updating restricted items (like role or email)
    const allowedUpdates = [
        "first_name", "last_name", "phone", "date_of_birth", 
        "gender", "nationality", "country_of_residence", 
        "address", "city", "country"
    ]; 

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    // update user info;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      updateOptions
    );

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
    update = { isVerified: true };
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
