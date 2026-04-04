const Scholarship = require("../models/scholarshipModel");
const University = require("../models/universityModel");
const Program = require("../models/programModel");
const createError = require("http-errors");
const mongoose = require("mongoose");

/**
 * Helper: Escape special characters for Regex to prevent crashes/injection
 */
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 * GET ALL SCHOLARSHIPS (With Filtering & Pagination)
 * @param {string} search - Search term
 * @param {string} university_id - Filter by university ID
 * @param {string} program_id - Filter by program ID
 * @param {boolean} is_active - Filter by active status
 * @param {boolean} upcoming_deadline - Filter scholarships with upcoming deadlines
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} { scholarships, pagination }
 */
const findAllScholarships = async (
  search = "",
  university_id = "",
  program_id = "",
  is_active = null,
  upcoming_deadline = false,
  page = 1,
  limit = 10
) => {
  const filter = {};

  // Validate pagination inputs
  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Number(limit));

  // Search filter
  if (search) {
    const safeSearch = escapeRegex(search.trim());
    const searchRegExp = new RegExp(".*" + safeSearch + ".*", "i");
    filter.$or = [
      { scholarship_name: { $regex: searchRegExp } },
      { description: { $regex: searchRegExp } },
      { amount: { $regex: searchRegExp } },
      { eligibility_criteria: { $regex: searchRegExp } },
    ];
  }

  // Filter by university
  if (university_id) {
    if (!mongoose.Types.ObjectId.isValid(university_id)) {
      throw createError(400, "Invalid University ID format");
    }
    filter.university = university_id;
  }

  // Filter by program
  if (program_id) {
    if (!mongoose.Types.ObjectId.isValid(program_id)) {
      throw createError(400, "Invalid Program ID format");
    }
    filter.program = program_id;
  }

  // Filter by active status
  if (is_active !== null && is_active !== undefined) {
    filter.is_active = is_active === true || is_active === "true";
  }

  // Filter by upcoming deadlines (deadline in the future)
  if (upcoming_deadline === true || upcoming_deadline === "true") {
    filter.deadline = { $gte: new Date() };
  }

  const scholarships = await Scholarship.find(filter)
    .populate("university", "name country city logo_url")
    .populate("program", "program_name degree_level field_of_study")
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ deadline: 1, createdAt: -1 }) // Sort by deadline (upcoming first), then by creation date
    .lean(); // Return plain JS objects for better performance

  const count = await Scholarship.countDocuments(filter);

  return {
    scholarships,
    pagination: {
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
      previousPage: pageNumber - 1 > 0 ? pageNumber - 1 : null,
      nextPage:
        pageNumber + 1 <= Math.ceil(count / limitNumber)
          ? pageNumber + 1
          : null,
      totalScholarships: count,
    },
  };
};

/**
 * GET SINGLE SCHOLARSHIP BY ID
 * @param {string} id - Scholarship ID
 * @returns {Object} Scholarship document with populated university and program
 */
const findScholarshipById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Scholarship ID format");
  }

  const scholarship = await Scholarship.findById(id)
    .populate("university")
    .populate("program");

  if (!scholarship) throw createError(404, "Scholarship not found");

  return scholarship;
};

/**
 * CREATE SCHOLARSHIP
 * @param {Object} scholarshipInfo - Scholarship data
 * @returns {Object} Created scholarship document
 */
const createScholarship = async (scholarshipInfo) => {
  // Validate required fields
  if (!scholarshipInfo.scholarship_name) {
    throw createError(400, "Scholarship name is required");
  }

  if (!scholarshipInfo.university) {
    throw createError(400, "University ID is required");
  }

  if (!scholarshipInfo.description) {
    throw createError(400, "Description is required");
  }

  if (!scholarshipInfo.amount) {
    throw createError(400, "Amount is required");
  }

  // Validate university ID format
  if (!mongoose.Types.ObjectId.isValid(scholarshipInfo.university)) {
    throw createError(400, "Invalid University ID format");
  }

  // Verify university exists
  const universityExists = await University.findById(
    scholarshipInfo.university
  );
  if (!universityExists) {
    throw createError(
      404,
      "University not found. Cannot create scholarship for non-existent university."
    );
  }

  // If program is provided, validate it
  if (scholarshipInfo.program) {
    if (!mongoose.Types.ObjectId.isValid(scholarshipInfo.program)) {
      throw createError(400, "Invalid Program ID format");
    }

    const programExists = await Program.findById(scholarshipInfo.program);
    if (!programExists) {
      throw createError(404, "Program not found");
    }

    // Verify program belongs to the same university
    if (
      programExists.university.toString() !==
      scholarshipInfo.university.toString()
    ) {
      throw createError(
        400,
        "Program does not belong to the specified university"
      );
    }
  }

  // Check for duplicate scholarship name within the same university
  const duplicateScholarship = await Scholarship.findOne({
    university: scholarshipInfo.university,
    scholarship_name: scholarshipInfo.scholarship_name.trim(),
  });

  if (duplicateScholarship) {
    throw createError(
      409,
      "Scholarship with this name already exists for this university"
    );
  }

  return await Scholarship.create(scholarshipInfo);
};

/**
 * UPDATE SCHOLARSHIP
 * @param {string} id - Scholarship ID
 * @param {Object} data - Update data
 * @returns {Object} Updated scholarship document
 */
const updateScholarship = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Scholarship ID format");
  }

  console.log(`Updating scholarship ${id} with data:`, data);
  // If updating university, verify new university exists
  if (data.university) {
    if (!mongoose.Types.ObjectId.isValid(data.university._id)) {
      throw createError(400, "Invalid University ID format");
    }
    const universityExists = await University.findById(data.university._id);
    if (!universityExists) {
      throw createError(404, "University not found");
    }
  }

  // If updating program, validate it
  if (data.program) {
    if (!mongoose.Types.ObjectId.isValid(data.program._id)) {
      throw createError(400, "Invalid Program ID format");
    }

    const programExists = await Program.findById(data.program._id);
    if (!programExists) {
      throw createError(404, "Program not found");
    }

    // Get current scholarship or new university to verify program belongs to university
    const currentScholarship = await Scholarship.findById(id);
    const universityId = data.university?._id || currentScholarship?.university;

    if (programExists.university.toString() !== universityId.toString()) {
      throw createError(
        400,
        "Program does not belong to the specified university"
      );
    }
  }

  // If updating scholarship name, check for duplicates within the same university
  if (data.scholarship_name) {
    const scholarship = await Scholarship.findById(id);
    if (!scholarship) {
      throw createError(404, "Scholarship not found");
    }

    const universityId = data.university?._id || scholarship.university;
    const nameExists = await Scholarship.findOne({
      scholarship_name: data.scholarship_name.trim(),
      university: universityId,
      _id: { $ne: id }, // Exclude current scholarship
    });

    if (nameExists) {
      throw createError(
        409,
        "Scholarship name already exists for this university"
      );
    }
  }

  const scholarship = await Scholarship.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!scholarship) throw createError(404, "Scholarship not found");

  return scholarship;
};

/**
 * DELETE SCHOLARSHIP
 * @param {string} id - Scholarship ID
 * @returns {Object} Deleted scholarship document
 */
const deleteScholarship = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, "Invalid Scholarship ID format");
  }

  const scholarship = await Scholarship.findByIdAndDelete(id);

  if (!scholarship) throw createError(404, "Scholarship not found");

  return scholarship;
};

module.exports = {
  findAllScholarships,
  findScholarshipById,
  createScholarship,
  updateScholarship,
  deleteScholarship,
};
