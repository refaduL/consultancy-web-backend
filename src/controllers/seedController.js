const data = require("../data/usersData");
const User = require("../models/userModel");

const seedUser = async (req, res, next) => {
  try {
    // deleting all existing data
    await User.deleteMany({});

    // inserting new users
    const users = await User.insertMany(data.users);

    // successful response
    return res.status(201).json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { seedUser };
