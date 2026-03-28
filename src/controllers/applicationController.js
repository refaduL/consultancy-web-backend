const createError = require("http-errors");
const Application = require("../models/applicationModel");
const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const { findApplicationByUserId, findApplicationByAppId, findAllApplications } = require("../services/applicationService");
const deleteOldFile = require("../helpers/deleteOldFile");

/**
 * 1. STUDENT: Submit or Update Textual Application
 * - Creates application if not exists.
 * - Updates application if exists (only if status is draft, submitted, or rejected).
 * - NO documents handled here.
 * - route: POST /api/applications/submit
 */

// const handleSubmitApplication = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const { educationHistory, testScores, preferences } = req.body;

//     console.log("check variables: \neducationHistory:\n", educationHistory, "\ntestScores:\n", testScores, "\npreferences:\n", preferences);

//     let application = await Application.findOne({ user: userId });

//     if (application) {
//       // UPDATE LOGIC
//       // Block updates if application is under review or approved
//       if (['accepted', 'approved'].includes(application.status)) {
//         throw createError(400, "Application is locked. You cannot edit details after acceptance.");
//       }

//       application.educationHistory = educationHistory || application.educationHistory;
//       application.testScores = testScores || application.testScores;
//       application.preferences = preferences || application.preferences;

//       // If re-applying after rejection, reset status to submitted
//       if (application.status === 'rejected' || application.status === 'draft') {
//         application.status = 'submitted';
//         application.timeline.submittedAt = new Date();
//         application.rejectionFeedback = undefined; // Clear previous feedback
//       }
//       await application.save();

//     } else {
//       // CREATE LOGIC
//       application = await Application.create({
//         user: userId,
//         status: 'submitted',
//         educationHistory,
//         testScores,
//         preferences,
//         timeline: {
//           submittedAt: new Date()
//         }
//       });

//       // Link to User
//       await User.findByIdAndUpdate(userId, { application: application._id });
//     }

//     return successResponse(res, {
//       statusCode: 200,
//       message: "Application submitted successfully",
//       payload: { application },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const LOCKED_STATUSES = ["accepted", "approved"];
const TEST_SCORE_KEYS = ["ielts", "toefl", "gre", "gmat", "duolingo", "pte"];

const handleSubmitApplication = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const {
      // User profile fields
      first_name, last_name, phone, nationality, country_of_residence, date_of_birth, gender,
      // Application fields
      educationHistory, testScores, preferences,financial_info,
    } = req.body;

    //  Validate required fields
    if (!first_name?.trim())
      throw createError(400, "first_name is required.");
    if (!phone?.trim())
      throw createError(400, "phone is required.");
    if (!nationality?.trim())
      throw createError(400, "nationality is required.");
    if (!country_of_residence?.trim())
      throw createError(400, "country_of_residence is required.");
    if (!Array.isArray(educationHistory) || educationHistory.length === 0)
      throw createError(400, "At least one education entry is required.");
    if (!preferences?.preferredCountries?.length)
      throw createError(400, "At least one preferred country is required.");
    if (!preferences?.preferredFieldOfStudy?.trim())
      throw createError(400, "preferredFieldOfStudy is required.");
    if (!preferences?.preferredIntake?.trim())
      throw createError(400, "preferredIntake is required.");
    if (!financial_info?.funding_source?.trim())
      throw createError(400, "funding_source is required.");

    //  Clean testScores: drop entries where score is blank 
    const cleanedTestScores = {};
    if (testScores && typeof testScores === "object") {
      for (const key of TEST_SCORE_KEYS) {
        const entry = testScores[key];
        if (entry?.score?.trim()) {
          cleanedTestScores[key] = {
            score: entry.score.trim(),
            ...(entry.date?.trim() ? { date: new Date(entry.date) } : {}),
          };
        }
      }
    }

    //  Build user profile update (only non-empty values) 
    const userUpdates = {
      ...((first_name?.trim())         && { first_name: first_name.trim() }),
      ...(last_name?.trim()            && { last_name: last_name.trim() }),
      ...(phone?.trim()                && { phone: phone.trim() }),
      ...(nationality?.trim()          && { nationality: nationality.trim() }),
      ...(country_of_residence?.trim() && { country_of_residence: country_of_residence.trim() }),
      ...(gender?.trim()               && { gender: gender.trim() }),
      ...(date_of_birth?.trim()        && { date_of_birth: new Date(date_of_birth) }),
    };

    await User.findByIdAndUpdate(userId, { $set: userUpdates });

    //  Upsert application 
    let application = await Application.findOne({ user: userId });

    if (application) {
      if (LOCKED_STATUSES.includes(application.status)) {
        throw createError(400, "Application is locked and cannot be edited after acceptance.");
      }

      application.educationHistory = educationHistory;
      application.preferences      = preferences;
      application.financial_info   = financial_info;

      // Merge: only overwrite test keys that came in with an actual score
      for (const key of TEST_SCORE_KEYS) {
        if (cleanedTestScores[key] !== undefined) {
          application.testScores[key] = cleanedTestScores[key];
        }
      }

      if (["draft", "rejected"].includes(application.status)) {
        application.status               = "submitted";
        application.timeline.submittedAt = new Date();
        application.rejectionFeedback    = undefined;
      }

      await application.save();
      
    } else {
      application = await Application.create({
        user: userId,
        status: "submitted",
        educationHistory,
        testScores: cleanedTestScores,
        preferences,
        financial_info,
        timeline: { submittedAt: new Date() },
      });

      await User.findByIdAndUpdate(userId, { application: application._id });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Application submitted successfully.",
      payload: { application },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * 2. AGENT: Initial Review (Accept/Reject)
 * - 'accepted': Unlocks document upload, Assigns Agent.
 * - 'rejected': Requires feedback.
 */
const handleInitialReview = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { review, rejectionFeedback } = req.body;
    const agentId = req.user.agent_profile; // The agent performing the action

    if (!['accepted', 'rejected'].includes(review)) {
      throw createError(400, "review must be 'accepted' or 'rejected'");
    }

    const application = await findApplicationByAppId(appId);

    if (application.status !== 'submitted') {
      throw createError(400, "Application must be in 'submitted' state for initial review.");
    }

    if (review === 'rejected') {
      if (!rejectionFeedback) throw createError(400, "Rejection feedback is required.");
      application.status = 'rejected';
      application.rejectionFeedback = rejectionFeedback;
      application.timeline.rejectedAt = new Date();
      // assign the agent to track who rejected it.
      application.agent = agentId;
    } else {
      // Accepted
      application.status = 'accepted';
      application.timeline.acceptedAt = new Date(); 
      application.agent = agentId; 
    }

    await application.save();

    return successResponse(res, {
      statusCode: 200,
      message: `Application ${application.status}`,
      payload: { application },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. STUDENT: Upload Documents
 * - Only allowed if status is 'accepted'.
 * - Handles file uploads via Multer.
 */
const handleUploadDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const files = req.files; 

    const application = await Application.findOne({ user: userId });
    if (!application) throw createError(404, "Application not found");
    
    // Allow uploads only when accepted
    if (application.status !== "accepted") {
      throw createError(403, "You can only upload documents when your application is accepted.");
    } 

    // Map uploaded files to schema fields
    const docFields = ['transcript', 'degreeCertificate', 'englishTestScore', 'statementOfPurpose', 'resume_cv', 'letterOfRecommendation1', 'letterOfRecommendation2', 'passportCopy', 'portfolio', 'workExperienceLetter'];

    let updatedCount = 0;

    docFields.forEach(field => {
        if (files[field] && files[field][0]) {

            // Get old filename from schema and delete
            const oldFilepath = application.documents[field]?.url;
            if (oldFilepath) {
              deleteOldFile(oldFilepath);
            }

            // Update the specific document field
            const file = files[field][0];
            const absolutePath = file.path; 
            const relativeUrl = `/uploads/applications/${file.filename}`;

            application.documents[field].url = relativeUrl;
            application.documents[field].status = 'uploaded';
            application.documents[field].adminFeedback = null;
            application.documents[field].uploadedAt = new Date();
            updatedCount++;
        }
    });

    if (updatedCount === 0) throw createError(400, "No files uploaded");

    await application.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Documents uploaded successfully",
      payload: { documents: application.documents },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. AGENT: Review Individual Document
 * - Accept/Reject specific docs (e.g., transcript).
 */
const handleDocumentReview = async (req, res, next) => {
  try {
    const { appId, docKey } = req.params;
    const { status, adminFeedback } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        throw createError(400, "Status must be 'approved' or 'rejected'");
    }

    const application = await findApplicationByAppId(appId);

    // Security: Only assigned agent (or admin) can review
    if (req.user.role.role_name !== 'admin' && application.agent.toString() !== req.user.agent_profile.toString()) {
        throw createError(403, "You are not the assigned agent for this application.");
    }

    if (!application.documents[docKey]) {
        throw createError(400, `Invalid document name: ${docKey}`);
    }

    application.documents[docKey].status = status;
    if (adminFeedback) {
      console.log(`Adding feedback for ${docKey}: ${adminFeedback}`);
      application.documents[docKey].adminFeedback = adminFeedback;
    }
    application.documents[docKey].updatedAt = new Date();

    await application.save();

    return successResponse(res, {
      statusCode: 200,
      message: `${docKey} marked as ${status}`,
      payload: { [docKey]: application.documents[docKey] },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * 5. AGENT: Final Approval
 * - Finalize the application status to 'approved' or 'rejected'.
 */
const handleFinalReview = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { review, rejectionFeedback } = req.body;

    if (!['approved', 'rejected'].includes(review)) {
        throw createError(400, "review must be 'approved' or 'rejected'");
    }

    const application = await findApplicationByAppId(appId);

    // Security check
    if (req.user.role.role_name !== 'admin' && application.agent.toString() !== req.user.agent_profile.toString()) {
        throw createError(403, "You are not the assigned agent.");
    }

    // Optional: Validation to ensure all docs are approved before final approval
    if (review === 'approved') {
        const docs = application.documents;
        const requiredDocs = ['transcript', 'resume_cv']; // Example required docs
        for (const doc of requiredDocs) {
            if (docs[doc].status !== 'approved') {
                throw createError(400, `Cannot approve application. ${doc.toUpperCase()} is not yet approved.`);
            }
        }
    }

    application.status = review;
    if (review === 'rejected' && rejectionFeedback) {
        application.rejectionFeedback = rejectionFeedback;
    }

    await application.save();

    return successResponse(res, {
      statusCode: 200,
      message: `Application Finalized: ${review}`,
      payload: { application },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET All Applications (For Agent Dashboard)
 */
const handleGetAllApplications = async (req, res, next) => {
    try {
        const { search, status, page, limit } = req.query;

        let agentId = null;

        // Check the route path to decide filtering: '/assigned' or '/all'
        if (req.path.includes('/assigned')) {
            if (!req.user.agent_profile) {
                throw createError(400, "User is not linked to a valid Agent Profile.");
            }
            agentId = req.user.agent_profile;
        }

        // Agents see all, or filtered by assigned agent here
        const data = await findAllApplications(search, status, page, limit, agentId);

        return successResponse(res, {
            statusCode: 200,
            message: `Total ${data.applications.length} applications fetched`,
            payload: data
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET Single Application 
 * Student gets own, Agent gets by ID
 */
const handleGetApplication = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const role = req.user.role.role_name;
        
        let application;

        if (role === 'student') {
            application = await findApplicationByUserId(userId);
        } else {
            // Agent/Admin accessing by ID param
            const { appId } = req.params;
            if (!appId) throw createError(400, "Application ID required for agents");
            application = await findApplicationByAppId(appId);
        }

        if (!application) throw createError(404, "Application not found");

        return successResponse(res, {
            statusCode: 200,
            message: "Application fetched",
            payload: { application }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  handleSubmitApplication,
  handleInitialReview,
  handleUploadDocuments,
  handleDocumentReview,
  handleFinalReview,
  handleGetAllApplications,
  handleGetApplication
};