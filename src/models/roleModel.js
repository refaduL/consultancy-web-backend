const mongoose = require("mongoose");
const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    role_name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
      enum: {
        values: ["student", "agent", "admin"],
        message:
          "{VALUE} is not a supported role. Must be one of: student, agent, admin.",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot be more than 200 characters"],
    },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
