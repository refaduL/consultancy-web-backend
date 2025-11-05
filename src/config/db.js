const mongoose = require("mongoose");
const { mongodbUrl } = require("../secret");

const connectDB = async (options = {}) => {
  try {
    await mongoose.connect(mongodbUrl, options);
    console.log(
      "Connection to MongoDB is successfully established!"
    );

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error: ", error);
    });
  } catch (error) {
    console.error("DB connection cannot establish: ", error.toString());
  }
};

module.exports = connectDB;
