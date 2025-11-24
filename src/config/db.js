const mongoose = require("mongoose");
const { mongodbUrl } = require("../secret");

const connectDB = async (options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 15000, // 15 seconds
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    }) => {
  try {
    await mongoose.connect(mongodbUrl, options);
    console.log("Connection to MongoDB is successfully established!");

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error: ", error);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("DB connection cannot establish: ", error.toString());
  }
};

module.exports = connectDB;
