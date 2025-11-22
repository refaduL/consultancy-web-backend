const express = require("express");
const seedRouter = express.Router();

const { seedDatabase } = require("../controllers/seedController");

// might need to protect this route in production 
// so random people don't reset database.
// For now, it's public for ease of development.

seedRouter.get("/", seedDatabase); 

module.exports = seedRouter;