const express = require("express");
const programRouter = express.Router();

const {
  handleGetPrograms,
  handleGetProgramById,
  handleCreateProgram,
  handleUpdateProgram,
  handleDeleteProgram
} = require("../controllers/programController");

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");

// PUBLIC ROUTES

// 1. Get All Programs (Search/Filter)
programRouter.get("/", handleGetPrograms);

// 2. Get Single Program Details
programRouter.get("/:id", handleGetProgramById);


// ADMIN ROUTES

// 3. Create Program
programRouter.post("/", isLoggedIn, authorize("admin", "agent"), handleCreateProgram);

// 4. Update Program
programRouter.put("/:id", isLoggedIn, authorize("admin", "agent"), handleUpdateProgram);

// 5. Delete Program
programRouter.delete("/:id", isLoggedIn, authorize("admin", "agent"), handleDeleteProgram);

module.exports = programRouter;