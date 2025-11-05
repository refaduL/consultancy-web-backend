const { body } = require("express-validator");

// sign up validation
const validateUserRegistration = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required. Enter your full name.")
    .isLength({ min: 3, max: 31 })
    .withMessage("Name should be at least 3 to 31 chars long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password should be at least 6 chars long.")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
    .withMessage(
      "Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required. Enter your address.")
    .isLength({ min: 3 })
    .withMessage("Address should be at least 3 chars long."),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required. Enter your num."),
  body("image").optional().isString().withMessage("User image is optional"),
  // body("image")
  //   .custom((value, { req }) => {
  //     if (!req.file || !req.file.buffer) {
  //       throw new Error("User image is required");
  //     }
  //     return true;
  //   })
  //   .withMessage("User img is requireddd"),
];

// sign in validation
const validateUserLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password should be at least 6 chars long.")
    // .matches(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    // )
    // .withMessage(
    //   "Password should match specific criteria"
    // ),
];

// update password validation
const validateUserPasswordUpdate = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required, right?")
    .isEmail()
    .withMessage("Invalid Email"),
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Old password is required")
    .isLength({ min: 6 })
    .withMessage("Password should be at least 6 chars long.")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
    .withMessage(
      "oldPassword: Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password should be at least 6 chars long.")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
    .withMessage(
      "newPassword: Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("confirmedPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error(
        "Your confirmed password doesnot match with new password"
      );
    }
    return true;
  }),
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserPasswordUpdate,
};
