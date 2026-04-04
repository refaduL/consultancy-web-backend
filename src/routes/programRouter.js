const express = require("express");
const programRouter = express.Router();


const { validateProgram } = require("../validators/programValidator");
const { runValidation } = require("../validators/index");
const {
  handleGetPrograms,
  handleGetProgramById,
  handleGetProgramsByUniId,
  handleCreateProgram,
  handleUpdateProgram,
  handleDeleteProgram
} = require("../controllers/programController");

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");

// PUBLIC ROUTES

// 1. Get All Programs (Search/Filter)
programRouter.get("/", validateProgram("getMany"), runValidation, handleGetPrograms);

// 2. Get Single Program Details
programRouter.get("/:id", validateProgram("getOne"), runValidation, handleGetProgramById);


// ADMIN ROUTES

// 3. Create Program
programRouter.post("/", validateProgram("create"), runValidation, isLoggedIn, authorize("admin", "agent"), handleCreateProgram);

// 4. Update Program
programRouter.put("/:id", validateProgram("update"), runValidation, isLoggedIn, authorize("admin", "agent"), handleUpdateProgram);

// 5. Delete Program
programRouter.delete("/:id",validateProgram("delete"), runValidation, isLoggedIn, authorize("admin", "agent"), handleDeleteProgram);

module.exports = programRouter;