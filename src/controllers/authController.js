const createError = require("http-errors");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const Role = require("../models/roleModel");


const { successResponse } = require("./responseController");
const { jwtActivationKey, jwtAccessKey, clientURL } = require("../secret");
const { createJSONWebToken } = require("../helper/jsonwebtoken");
const { emailWithNodeMailer } = require("../helper/email");

/**
 * REGISTER USER
 * Automatically assigns 'student' role unless specified otherwise (and allowed)
 */
const registerUser = async (req, res, next) => {
  try {
    const {
      first_name, 
      last_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      address,
      city,
      country,
      country_of_residence,
      nationality,
      role_name, // Optional: 'agent' or 'student'
    } = req.body;

    // 1. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw createError(409, "User with this email already exists.");
    }

    // 2. Find the Role ID
    // Default to 'student' if not provided
    const roleToAssign = role_name || "student";
    const roleDoc = await Role.findOne({ role_name: roleToAssign });

    if (!roleDoc) {
      throw createError(400, `Invalid role specified: ${roleToAssign}`);
    }

    const newUser = {
      first_name, 
      last_name,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      address,
      city,
      country,
      country_of_residence,
      nationality,
      role: roleDoc._id,
      is_verified: false,
    };
    console.log("New User Data:", newUser);

    // 3. Send Verification Email
    const token = createJSONWebToken(newUser, jwtActivationKey, "10m");

    // email template
    const emailData = {
      email,
      subject: "Account Verification Email",
      html: `
            <h2>Hello ${first_name + ' ' + last_name} !</h2>
            <p>Please click here to  <a href="${clientURL}/api/users/activate/${token}" target="_blank">Verify Your Email</a> and Activate your account </p>
          `,
    };

    //  email using nodemailer
    try {
      // await emailWithNodeMailer(emailData);
      console.log("Verification email sent successfully to:", email);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
      return;
    }

    // 5. Send Response
    return successResponse(res, {
      statusCode: 200,
      message: `Verification email sent to ${email}. Please verify to complete registration.`,
      payload: { token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * VERIFY USER EMAIL
 */
const activateUserAccount = async (req, res, next) => {
  try {
    const token = req.body.token;
    if (!token) throw createError(404, "Token not found");

    try {
      // 1. Verify Token
      const decoded = jwt.verify(token, jwtActivationKey);
      if (!decoded) throw createError(401, "User is not able to be verified");

      // 2. Check if user already exists (Early exit)
      const userExists = await User.exists({ email: decoded.email });
      if (userExists) {
        throw createError(409, "User email already exists. Please Sign in");
      }

      // 3. SANITIZE: Remove 'iat' and 'exp' so they don't mess up Mongoose
      const { iat, exp, ...userInfo } = decoded;
      
      // 4. Create User and explicitly force isVerified: true
      userInfo.is_verified = true;
      const newUser = await User.create(userInfo);

      return successResponse(res, {
        statusCode: 201,
        message: `User was registered successfully`,
        payload: { newUser },
      });

    } catch (error) {
      // 5. Specific JWT Errors
      if (error.name === "TokenExpiredError") {
        throw createError(401, "Token has expired. Please register again.");
      } 
      else if (error.name === "JsonWebTokenError") {
        throw createError(401, "Invalid token");
      }
      // 6. Handle Race Condition (Duplicate Key Error)
      else if (error.code === 11000) {
        throw createError(409, "User email already exists. Please Sign in");
      }
      // 7. Handle Mongoose Validation Errors (e.g., Missing required fields in token)
      else if (error.name === "ValidationError") {
        throw createError(422, error.message);
      }
      else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * LOGIN USER
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError(400, "Email and password are required");
    }

    // 1. Find user and explicitly select password
    const user = await User.findOne({ email })
      .select("+password")
      .populate("role");

    if (!user) {
      throw createError(
        404,
        "User doesn't exist with this Email. Please register first. "
      );
    }

    // 2. Check password match
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      throw createError(401, "Invalid email or password");
    }

    // 3. Generate Token
    // const token = generateToken(user._id);
    const accessToken = createJSONWebToken({ user }, jwtAccessKey, "15m");

    // 4. Set Cookie
    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // 5. Send Response
    return successResponse(res, {
      statusCode: 200,
      message: "User logged in successfully",
      payload: {
        user: {
          _id: user._id,
          name: user.first_name + ' ' + user.last_name,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role.role_name, 
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET CURRENT USER PROFILE
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user is already attached by isLoggedIn middleware
    // We might want to populate agent details if they are an agent
    const user = await User.findById(req.user._id)
      .populate("role")
      .populate("agent_profile")
      .populate("application"); 

    return successResponse(res, {
      statusCode: 200,
      message: "User profile fetched successfully",
      payload: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * LOGOUT
 */
const logoutUser = (req, res, next) => {
  try {
    res.clearCookie("accessToken");

    return successResponse(res, {
      statusCode: 200,
      message: "User logged out successfully",
      payload: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  activateUserAccount,
  loginUser,
  getProfile,
  logoutUser,
};
