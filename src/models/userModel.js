const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const { defaultImagepath } = require("../secret.js");

const userSchema = new Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [31, "The length of Username can be maximum 31 char"],
    },
    last_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please fill a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "User password is required"],
      minlength: [6, "The length of User password should be minimum 6 char"],
      maxlength: [31, "The length of User password can be maximum 31 char"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    date_of_birth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    nationality: {
      type: String,
      trim: true,
      required: [true, "Nationality is required"],
    },
    country_of_residence: {
      type: String,
      trim: true,
      required: [true, "Country of residence is required"],
    },

    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },

    // === Profile & Other Attributes ===

    profile_picture_url: {
      type: String,
      default: defaultImagepath,

      // type: Buffer,
      // contentType: String,
      // required: [true, 'User image is required'],

      //   default: "https://placehold.co/400x400/eeeeee/888888?text=User",
    },
    is_verified: {
      type: Boolean,
      default: false,
    },

    // === Relationships ===

    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    agent_profile: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },

    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
  },
  { timestamps: true }
);

// === HOOKS (Middleware) ===

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// === METHODS ===

userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = await this.constructor.findById(this._id).select("+password");
  return await bcrypt.compare(candidatePassword, user.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;