const mongoose = require("mongoose");
const createError = require("http-errors");
const User = require("../models/userModel");

const findWithId = async (Model, id, options = {}) => {
  try {
    const item = await Model.findById(id, options);
    if (!item)
        throw createError(404, `${Model.modelName} doesn't exist with this id: ${id}`);
    return item;
  } catch (error) {
    if (error instanceof mongoose.Error) {
      throw createError(400, "Invalid Item Id");
    }
    throw error;
  }

  return item;
};

module.exports = { findWithId };
