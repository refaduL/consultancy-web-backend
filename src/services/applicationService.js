const Application = require("../models/applicationModel");
const User = require("../models/userModel");
const createError = require("http-errors");

/**
 * Find application by User ID
 */
const findApplicationByUserId = async (userId) => {
  return await Application.findOne({ user: userId })
    .populate("agent", "first_name last_name email bio specializations")
    .populate("user", "first_name last_name email phone");
};

/**
 * Find application by Application ID
 */
const findApplicationByAppId = async (appId) => {
  const app = await Application.findById(appId)
    .populate("user", "first_name last_name email phone nationality");
  
  if (!app) throw createError(404, "Application not found");
  return app;
};

/**
 * Find all applications (with filtering for Agents)
 */
const findAllApplications = async (search, status, page = 1, limit = 10, agentId = null) => {
  const filter = {};
  if (status) filter.status = status;
  if (agentId) filter.agent = agentId;
  
  // Optional: Add search logic here if needed (e.g., searching by user name)
  
  const applications = await Application.find(filter)
    .populate("user", "first_name last_name email country_of_residence")
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ updatedAt: -1 });

  const count = await Application.countDocuments(filter);

  return {
    applications,
    pagination: {
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previousPage: page - 1 > 0 ? page - 1 : null,
      nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      totalApplications: count
    }
  };
};

module.exports = {
  findApplicationByUserId,
  findApplicationByAppId,
  findAllApplications
};