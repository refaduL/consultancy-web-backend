const express = require("express");
const applicationRouter = express.Router();

const {
  handleSubmitApplication,
  handleInitialReview,
  handleUploadDocuments,
  handleDocumentReview,
  handleFinalDecision,
  handleGetAllApplications,
  handleGetApplication,
} = require("../controllers/applicationController");

const uploadFile = require("../middlewares/uploadFile");
const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const { validateApplication } = require("../validators/applicationValidator");
const { runValidation } = require("../validators/index");

// === STUDENT ROUTES ===

// 1. Submit or Update Application (Text fields only)
applicationRouter.post(
  "/submit",
  validateApplication("create"),
  runValidation,
  isLoggedIn,
  authorize("student"),
  handleSubmitApplication
);

// 2. Upload Documents (Only after acceptance)
// We use .fields() to handle multiple named inputs
applicationRouter.put(
  "/upload-docs",
  isLoggedIn,
  authorize("student"),
  uploadFile.fields([
    { name: "transcript", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
    { name: "englishTestScore", maxCount: 1 },
    { name: "statementOfPurpose", maxCount: 1 },
    { name: "letterOfRecommendation1", maxCount: 1 },
    { name: "letterOfRecommendation2", maxCount: 1 },
    { name: "resume_cv", maxCount: 1 },
    { name: "passportCopy", maxCount: 1 },
    { name: "portfolio", maxCount: 1 },
    { name: "workExperienceLetter", maxCount: 1 },
  ]),
  handleUploadDocuments
);

// 3. Get My Application
applicationRouter.get(
  "/me",
  validateApplication("getOne"),
  runValidation,
  isLoggedIn,
  authorize("student"),
  handleGetApplication
);

// === AGENT / ADMIN ROUTES ===

// 4. Get All Applications
applicationRouter.get(
  "/all",
  validateApplication("getMany"),
  runValidation,
  // isLoggedIn,
  // authorize("agent", "admin"),
  handleGetAllApplications
);

applicationRouter.get(
  "/assigned",
  validateApplication("getMany"),
  runValidation,
  isLoggedIn,
  authorize("agent"),
  handleGetAllApplications
);

// 5. Get Specific Application by ID
applicationRouter.get(
  "/:id",
  validateApplication("getOne"),
  runValidation,
  isLoggedIn,
  authorize("agent", "admin"),
  handleGetApplication
);

// 6. Initial Review (Accept/Reject textual data)
applicationRouter.put(
  "/:id/initial-review",
  isLoggedIn,
  authorize("agent", "admin"),
  handleInitialReview
);

// 7. Review Specific Document
applicationRouter.put(
  "/:id/doc-review",
  isLoggedIn,
  authorize("agent", "admin"),
  handleDocumentReview
);

// 8. Final Decision (Approve/Reject entire app)
applicationRouter.put(
  "/:id/final-decision",
  isLoggedIn,
  authorize("agent", "admin"),
  handleFinalDecision
);

module.exports = applicationRouter;
