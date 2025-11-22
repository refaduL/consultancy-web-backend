const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Agent = require("../models/agentModel");
const University = require("../models/universityModel");
const Program = require("../models/programModel");
const Course = require("../models/courseModel");
const Scholarship = require("../models/scholarshipModel");
const Application = require("../models/applicationModel");

const { successResponse } = require("./responseController");
const { data } = require("../data/seedData");

const seedDatabase = async (req, res, next) => {
  try {
    // 1. Clear existing data
    // Using deleteMany({}) ensures we start fresh every time we hit this route
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Agent.deleteMany({}),
      University.deleteMany({}),
      Program.deleteMany({}),
      Course.deleteMany({}),
      Scholarship.deleteMany({}),
      Application.deleteMany({}),
    ]);

    console.log("--- Cleared Database ---");

    // 2. Insert Roles
    // We use insertMany for static data that doesn't need hooks
    await Role.insertMany(data.roles);
    console.log("--- Seeded Roles ---");

    // 3. Insert Users
    // CRITICAL: We iterate and use User.create() to ensure the password hashing
    // hook in User model is triggered. insertMany() skips hooks!
    for (const user of data.users) {
      await User.create(user);
    }
    console.log("--- Seeded Users ---");

    // 4. Insert the rest of the data
    // insertMany is faster and fine here as we don't have pre-save hooks on these
    await Agent.insertMany(data.agents);
    await University.insertMany(data.universities);
    await Program.insertMany(data.programs);
    await Course.insertMany(data.courses);
    await Scholarship.insertMany(data.scholarships);
    
    console.log("--- Seeded Academic Data ---");

    return successResponse(res, {
      statusCode: 201,
      message: "Database seeded successfully!",
      payload: {
        usersCreated: data.users.length,
        universitiesCreated: data.universities.length,
        programsCreated: data.programs.length
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { seedDatabase };