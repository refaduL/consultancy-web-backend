const University = require("../models/universityModel");
const Program = require("../models/programModel");
const createError = require("http-errors");
const mongoose = require("mongoose");

// Helper: Escape special characters for Regex to prevent crashes/injection
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//  Get All Universities with Filtering & Pagination

const findAllUniversities = async (search = "", page = 1, limit = 10) => {
  const filter = {};

  // Validate pagination inputs
  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Number(limit));

  if (search) {
    const safeSearch = escapeRegex(search.trim());
    const searchRegExp = new RegExp(".*" + safeSearch + ".*", "i");
    filter.$or = [
      { name: { $regex: searchRegExp } },
      { city: { $regex: searchRegExp } },
      { country: { $regex: searchRegExp } },
    ];
  }

  const universities = await University.find(filter)
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ name: 1 })
    .lean(); // Return plain JS objects for better performance

  const count = await University.countDocuments(filter);

  return {
    universities,
    pagination: {
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
      previousPage: pageNumber - 1 > 0 ? pageNumber - 1 : null,
      nextPage:
        pageNumber + 1 <= Math.ceil(count / limitNumber)
          ? pageNumber + 1
          : null,
      totalUniversities: count,
    },
  };
};

/**
 * Get Single University
 */
const findUniversityById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid University ID format");
  }

  const university = await University.findById(id)
    .populate("programs")
    .populate("scholarships");

  if (!university) throw createError(404, "University not found");

  return university;
};

/**
 * Create University
 */
const createUniversity = async (uniInfo) => {
  // Basic validation check
  if (!uniInfo.name || !uniInfo.country || !uniInfo.city) {
    throw createError(400, "Name, Country, and City are required fields");
  }

  // Check for duplicate name
  const exists = await University.findOne({ name: uniInfo.name.trim() });
  if (exists)
    throw createError(409, "University with this name already exists");

  // console.log("uni will be added: ", uniInfo);
    return await University.create(uniInfo);
};

/**
 * Update University
 */
const updateUniversity = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid University ID format");
  }

  // If updating name, ensure it doesn't conflict with another university
  if (data.name) {
    const nameExists = await University.findOne({
      name: data.name.trim(),
      _id: { $ne: id }, // Exclude current doc
    });
    if (nameExists)
      throw createError(
        409,
        "University name already taken by another institution"
      );
  }

  const university = await University.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!university) throw createError(404, "University not found");
  return university;
};

/**
 * Delete University
 */
const deleteUniversity = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid University ID format");
  }

  const university = await University.findById(id);
  if (!university) throw createError(404, "University not found");

  // INTEGRITY CHECK: Prevent deleting if programs exist
  const linkedPrograms = await Program.countDocuments({ university: id });
  if (linkedPrograms > 0) {
    throw createError(
      400,
      `Cannot delete university. It has ${linkedPrograms} linked academic programs. Please delete the programs first.`
    );
  }

  await University.findByIdAndDelete(id);
  return university;
};

module.exports = {
  findAllUniversities,
  findUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
};
