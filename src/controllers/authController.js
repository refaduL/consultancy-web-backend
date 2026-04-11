const createError = require("http-errors");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const Role = require("../models/roleModel");

const { successResponse } = require("./responseController");
const { jwtActivationKey, jwtAccessKey, serverURL, clientURL } = require("../secret");
const { createJSONWebToken } = require("../helpers/jsonwebtoken");
const emailWithNodeMailer = require("../helpers/email");

// /**
//  * REGISTER USER
//  * Automatically assigns 'student' role unless specified otherwise (and allowed)
//  */
// const registerUser = async (req, res, next) => {
//   try {
//     console.log("Register User Request Body:", req.body);
//     const {
//       first_name,
//       last_name,
//       email,
//       password,
//       phone,
//       date_of_birth,
//       gender,
//       address,
//       city,
//       country,
//       country_of_residence,
//       nationality,
//       role_name, // Optional: 'agent' or 'student'
//     } = req.body;

//     // 1. Check if user exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       throw createError(409, "User with this email already exists.");
//     }

//     // 2. Find the Role ID
//     // Default to 'student' if not provided
//     const roleToAssign = role_name || "student";
//     const roleDoc = await Role.findOne({ role_name: roleToAssign });

//     if (!roleDoc) {
//       throw createError(400, `Invalid role specified: ${roleToAssign}`);
//     }

//     const newUser = {
//       first_name,
//       last_name,
//       email,
//       password,
//       phone,
//       date_of_birth,
//       gender,
//       address,
//       city,
//       country,
//       country_of_residence,
//       nationality,
//       role: roleDoc._id,
//       is_verified: false,
//     };
//     console.log("New User Data:", newUser);

//     // 3. Send Verification Email
//     const token = createJSONWebToken(newUser, jwtActivationKey, "10m");

//     // email template
//     const emailData = {
//       email,
//       subject: "Account Verification Email",
//       html: `
//             <h2>Hello ${first_name + " " + last_name} !</h2>
//             <p>Please click here to  <a href="${serverURL}/api/auth/activate/${token}" target="_blank">Verify Your Email</a> and Activate your account </p>
//           `,
//     };

//     //  email using nodemailer
//     try {
//       await emailWithNodeMailer(emailData);
//       console.log("Verification email sent successfully to:", email);
//       console.log("Email content:", emailData);
//     } catch (emailError) {
//       console.error("Email error happened: ", emailError);
//       next(createError(500, "Failed to send verification email"));
//       return;
//     }

//     // 5. Send Response
//     return successResponse(res, {
//       statusCode: 200,
//       message: `Verification email sent to ${email}. Please verify to complete registration.`,
//       payload: { token },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * VERIFY USER EMAIL
//  */
// const activateUserAccount = async (req, res, next) => {
//   try {
//     // const token = req.body.token;
//     const token = req.params.token;
//     if (!token) throw createError(404, "Token not found");
//     console.log("Activating account with token:");

//     try {
//       // 1. Verify Token
//       const decoded = jwt.verify(token, jwtActivationKey);
//       if (!decoded) throw createError(401, "User is not able to be verified");

//       // 2. Check if user already exists (Early exit)
//       const userExists = await User.exists({ email: decoded.email });
//       if (userExists) {
//         throw createError(409, "User email already exists. Please Sign in");
//       }

//       // 3. SANITIZE: Remove 'iat' and 'exp' so they don't mess up Mongoose
//       const { iat, exp, ...userInfo } = decoded;

//       // 4. Create User and explicitly force isVerified: true
//       userInfo.is_verified = true;
//       const newUser = await User.create(userInfo);

//       console.log("Newly Activated User:", newUser);

//       // return successResponse(res, {
//       //   statusCode: 201,
//       //   message: `User was registered successfully`,
//       //   payload: { newUser },
//       // });

//       if (req.headers.accept?.includes("application/json")) {
//         return successResponse(res, {
//           statusCode: 201,
//           message: `User was registered successfully`,
//           payload: { newUser },
//         });
//       } else {
//         return res.redirect(`${clientURL}/login?activated=true`);
//       }
//     } catch (error) {
//       // 5. Specific JWT Errors
//       if (error.name === "TokenExpiredError") {
//         throw createError(401, "Token has expired. Please register again.");
//       } else if (error.name === "JsonWebTokenError") {
//         throw createError(401, "Invalid token");
//       }
//       // 6. Handle Race Condition (Duplicate Key Error)
//       else if (error.code === 11000) {
//         throw createError(409, "User email already exists. Please Sign in");
//       }
//       // 7. Handle Mongoose Validation Errors (e.g., Missing required fields in token)
//       else if (error.name === "ValidationError") {
//         throw createError(422, error.message);
//       } else {
//         throw error;
//       }
//     }
//   } catch (error) {
//     next(error);
//   }
// };

/**
 * REGISTER USER
 * Creates and saves user in database with is_verified = false
 * Automatically assigns 'student' role unless specified otherwise (and allowed)
 */
const registerUser = async (req, res, next) => {
  try {
    console.log("Register User Request Body:", req.body);
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

    // 3. Create user data and save to database (is_verified = false)
    const newUser = new User({
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
    });

    // Save user to database
    await newUser.save();
    console.log("User saved to database with is_verified = false:", newUser.email);

    // 4. Send Verification Email
    const token = createJSONWebToken(
      { email: newUser.email, userId: newUser._id }, 
      jwtActivationKey, 
      "10m"
    );

    // email template
    const emailData = {
      email,
      subject: "Account Verification Email",
      html: `
            <h2>Hello ${first_name + " " + last_name} !</h2>
            <p>Please click here to <a href="${serverURL}/api/auth/activate/${token}" target="_blank">Verify Your Email</a> to activate your account.</p>
            <p>This link will expire in 10 minutes.</p>
          `,
    };

    // send email using nodemailer
    try {
      await emailWithNodeMailer(emailData);
      console.log("Verification email sent successfully to:", email);
    } catch (emailError) {
      console.error("Email error happened: ", emailError);
      // User is created but email failed - you might want to handle this differently
      throw createError(500, "Failed to send verification email");
    }

    // 5. Send Response
    return successResponse(res, {
      statusCode: 201,
      message: `User registered successfully. Verification email sent to ${email}. Please verify your email to activate your account.`,
      payload: { 
        user: {
          id: newUser._id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          is_verified: false
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * VERIFY USER EMAIL
 * ONLY verifies the user's email and updates is_verified to true
 * Does NOT create user account (already created in registerUser)
 */
const activateUserAccount = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) throw createError(404, "Token not found");
    console.log("Activating account with token");

    try {
      // 1. Verify Token
      const decoded = jwt.verify(token, jwtActivationKey);
      if (!decoded) throw createError(401, "Invalid or expired token");

      const { email, userId } = decoded;

      // 2. Find the user in database
      const user = await User.findOne({ email });
      
      if (!user) {
        throw createError(404, "User not found. Please register first.");
      }

      // 3. Check if user is already verified
      if (user.is_verified) {
        throw createError(400, "Account already verified. Please login.");
      }

      // 4. Update user's is_verified to true (ONLY this)
      user.is_verified = true;
      await user.save();
      
      console.log("User email verified successfully:", user.email);

      // 5. Send appropriate response based on request type
      if (req.headers.accept?.includes("application/json")) {
        return successResponse(res, {
          statusCode: 200,
          message: `Email verified successfully! Your account is now active.`,
          payload: { 
            user: {
              id: user._id,
              email: user.email,
              is_verified: true
            }
          },
        });
      } else {
        // Redirect to frontend login page for browser requests
        return res.redirect(`${clientURL}/login?verified=true`);
      }
      
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === "TokenExpiredError") {
        throw createError(401, "Verification token has expired. Please request a new verification email.");
      } else if (error.name === "JsonWebTokenError") {
        throw createError(401, "Invalid verification token.");
      }
      // Re-throw other errors
      else {
        console.log("i am here throwing logged in error");
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN VERIFY USER BY EMAIL
 * Verify user by email address instead of ID
 */
const adminVerifyUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1. Validate email
    if (!email) {
      throw createError(400, "Email address is required");
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      throw createError(404, "User not found with this email address");
    }

    // 3. Check if already verified
    if (user.is_verified) {
      throw createError(400, "User account is already verified");
    }

    // 4. Update verification status
    user.is_verified = true;
    await user.save();
    
    console.log(`Admin verified user by email: ${user.email}`);

    return successResponse(res, {
      statusCode: 200,
      message: `User with email ${email} has been verified successfully`,
      payload: {
        user: {
          id: user._id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          is_verified: true
        }
      },
    });
    
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      throw createError(404, "User not found");
    }
    
    if (user.is_verified) {
      throw createError(400, "User already verified");
    }
    
    // Generate new token
    const token = createJSONWebToken(
      { email: user.email, userId: user._id }, 
      jwtActivationKey, 
      "10m"
    );
    
    // Send email
    const emailData = {
      email,
      subject: "Account Verification Email (Resent)",
      html: `
        <h2>Hello ${user.first_name + " " + user.last_name} !</h2>
        <p>Please click here to <a href="${serverURL}/api/auth/activate/${token}" target="_blank">Verify Your Email</a> to activate your account.</p>
        <p>This link will expire in 10 minutes.</p>
      `,
    };
    
    await emailWithNodeMailer(emailData);
    
    return successResponse(res, {
      statusCode: 200,
      message: `Verification email resent to ${email}`,
    });
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
    const accessToken = createJSONWebToken({ user }, jwtAccessKey, "60m");

    // 4. Set Cookie
    res.cookie("accessToken", accessToken, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // 5. Send Response
    return successResponse(res, {
      statusCode: 200,
      message: "User logged in successfully",
      payload: {
        user: {
          _id: user._id,
          name: user.first_name + " " + user.last_name,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role.role_name,
        },
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
// const logoutUser = (req, res, next) => {
//   try {
//     res.clearCookie("accessToken");

//     return successResponse(res, {
//       statusCode: 200,
//       message: "User logged out successfully",
//       payload: {},
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const logoutUser = (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // Explicitly set the path
      domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined // Add your domain
    });

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
  adminVerifyUserByEmail,
  resendVerificationEmail,
  loginUser,
  getProfile,
  logoutUser,
};
