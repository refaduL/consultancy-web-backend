const Program = require("../models/programModel");
const University = require("../models/universityModel");
const createError = require("http-errors");
const mongoose = require("mongoose");

/**
 * Helper: Escape regex characters to prevent injection
 */
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * GET ALL PROGRAMS (With Advanced Filtering)
 */
const findAllPrograms = async (query) => {
  const { 
    search, 
    degree_level, 
    field_of_study, 
    study_mode,
    university_id,
    min_fee, 
    max_fee, 
    page = 1, 
    limit = 10 
  } = query;

  const filter = {};
  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Number(limit));

  // 1. Search by Program Name
  if (search) {
    filter.program_name = { $regex: new RegExp(escapeRegex(search.trim()), "i") };
  }

  // 2. Filter by Degree Level (Exact match)
  if (degree_level) {
    filter.degree_level = degree_level;
  }

  // 3. Filter by Field of Study (Partial match)
  if (field_of_study) {
    filter.field_of_study = { $regex: new RegExp(escapeRegex(field_of_study.trim()), "i") };
  }

  // 4. Filter by Study Mode (Full-time, Online, etc.)
  if (study_mode) {
    filter.study_mode = study_mode;
  }

  // 5. Filter by specific University
  if (university_id) {
    if (mongoose.Types.ObjectId.isValid(university_id)) {
      filter.university = university_id;
    }
  }

  // 6. Fee Range Filter
  if (min_fee || max_fee) {
    filter.tuition_fee = {};
    if (min_fee) filter.tuition_fee.$gte = Number(min_fee);
    if (max_fee) filter.tuition_fee.$lte = Number(max_fee);
  }

  const programs = await Program.find(filter)
    .populate("university", "name country type") // Populate essential uni details
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ createdAt: -1 })
    .lean();

  const count = await Program.countDocuments(filter);

  return {
    programs,
    pagination: {
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
      previousPage: pageNumber - 1 > 0 ? pageNumber - 1 : null,
      nextPage: pageNumber + 1 <= Math.ceil(count / limit) ? pageNumber + 1 : null,
      totalPrograms: count
    }
  };
};

/**
 * GET SINGLE PROGRAM
 */
const findProgramById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Program ID format");
  }

  const program = await Program.findById(id)
    .populate("university") // Full uni details
    .populate("courses")    // Virtual field
    .populate("scholarships"); // Virtual field

  if (!program) throw createError(404, "Program not found");
  
  return program;
};

/**
 * CREATE PROGRAM
 */
const createProgram = async (progInfo) => {
  // 1. Validate University
  if (!progInfo.university) throw createError(400, "University ID is required");
  if (!mongoose.Types.ObjectId.isValid(progInfo.university)) throw createError(400, "Invalid University ID");

  const universityExists = await University.findById(progInfo.university);
  if (!universityExists) throw createError(404, "University not found");

  // 2. Create
  const program = await Program.create(progInfo);
  if (!program) throw createError(500, "Failed to create program. Please try again.");
  return program;
};

/**
 * UPDATE PROGRAM
 */
const updateProgram = async (id, upProgInfo) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createError(400, "Invalid Program ID");

  // If updating university link, verify new university exists
  if (upProgInfo.university) {
    if (!mongoose.Types.ObjectId.isValid(upProgInfo.university)) throw createError(400, "Invalid University ID");
    const universityExists = await University.findById(upProgInfo.university);
    if (!universityExists) throw createError(404, "University not found");
  }

  const program = await Program.findByIdAndUpdate(id, upProgInfo, {
    new: true,
    runValidators: true,
  });

  if (!program) throw createError(404, "Program not found");
  return program;
};

/**
 * DELETE PROGRAM
 */
const deleteProgram = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw createError(400, "Invalid Program ID");

  const program = await Program.findByIdAndDelete(id);
  if (!program) throw createError(404, "Program not found");
  return program;
};

module.exports = {
  findAllPrograms,
  findProgramById,
  createProgram,
  updateProgram,
  deleteProgram
};