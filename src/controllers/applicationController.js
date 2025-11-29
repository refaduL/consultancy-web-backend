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
 */
const handleSubmitApplication = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { educationHistory, testScores, preferences } = req.body;

    console.log("check variables: \neducationHistory:\n", educationHistory, "\ntestScores:\n", testScores, "\npreferences:\n", preferences);

    let application = await Application.findOne({ user: userId });

    if (application) {
      // UPDATE LOGIC
      // Block updates if application is under review or approved
      if (['accepted', 'approved'].includes(application.status)) {
        throw createError(400, "Application is locked. You cannot edit details after acceptance.");
      }

      application.educationHistory = educationHistory || application.educationHistory;
      application.testScores = testScores || application.testScores;
      application.preferences = preferences || application.preferences;

      // If re-applying after rejection, reset status to submitted
      if (application.status === 'rejected' || application.status === 'draft') {
        application.status = 'submitted';
        application.rejectionFeedback = undefined; // Clear previous feedback
      }

      await application.save();
    } else {
      // CREATE LOGIC
      application = await Application.create({
        user: userId,
        status: 'submitted',
        educationHistory,
        testScores,
        preferences
      });

      // Link to User
      await User.findByIdAndUpdate(userId, { application: application._id });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Application submitted successfully",
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
    const { id } = req.params;
    const { review, rejectionFeedback } = req.body;
    const agentId = req.user.agent_profile; // The agent performing the action

    if (!['accepted', 'rejected'].includes(review)) {
      throw createError(400, "review must be 'accepted' or 'rejected'");
    }

    const application = await findApplicationByAppId(id);

    if (application.status !== 'submitted') {
      throw createError(400, "Application must be in 'submitted' state for initial review.");
    }

    if (review === 'rejected') {
      if (!rejectionFeedback) throw createError(400, "Rejection feedback is required.");
      application.status = 'rejected';
      application.rejectionFeedback = rejectionFeedback;
      // Note: We don't assign the agent on rejection, allowing others to review next time? 
      // Or assign them anyway. 
      // Let's assign to track who rejected it.
      application.agent = agentId;
    } else {
      // Accepted
      application.status = 'accepted';
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
    const docFields = ['transcript', 'statementOfPurpose', 'resume_cv', 'letterOfRecommendation1', 'letterOfRecommendation2'];

    let updatedCount = 0;

    docFields.forEach(field => {
        if (files[field] && files[field][0]) {

            // Get old filename from schema and delete
            const oldFilepath = application.documents[field]?.url;
            if (oldFilepath) {
              deleteOldFile(oldFilepath);
            }

            // Update the specific document field
            application.documents[field].url = files[field][0].path;
            application.documents[field].status = 'submitted';
            application.documents[field].feedback = null;
            application.documents[field].updatedAt = new Date();
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
    const { id } = req.params;
    const { docName, status, feedback } = req.body;

    if (!['approved', 'rejected_for_revision'].includes(status)) {
        throw createError(400, "Status must be 'approved' or 'rejected_for_revision'");
    }

    const application = await findApplicationByAppId(id);

    // Security: Only assigned agent (or admin) can review
    if (req.user.role.role_name !== 'admin' && application.agent.toString() !== req.user.agent_profile.toString()) {
        throw createError(403, "You are not the assigned agent for this application.");
    }

    if (!application.documents[docName]) {
        throw createError(400, `Invalid document name: ${docName}`);
    }

    application.documents[docName].status = status;
    if (feedback) application.documents[docName].feedback = feedback;
    application.documents[docName].updatedAt = new Date();

    await application.save();

    return successResponse(res, {
      statusCode: 200,
      message: `${docName} marked as ${status}`,
      payload: { [docName]: application.documents[docName] },
    });

  } catch (error) {
    next(error);
  }
};

/**
 * 5. AGENT: Final Approval
 * - Finalize the application status to 'approved' or 'rejected'.
 */
const handleFinalDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { review, rejectionFeedback } = req.body;

    if (!['approved', 'rejected'].includes(review)) {
        throw createError(400, "review must be 'approved' or 'rejected'");
    }

    const application = await findApplicationByAppId(id);

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
                throw createError(400, `Cannot approve application. ${doc} is not yet approved.`);
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
      message: `Application Finalized: ${status}`,
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
            const { id } = req.params;
            if (!id) throw createError(400, "Application ID required for agents");
            application = await findApplicationByAppId(id);
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
  handleFinalDecision,
  handleGetAllApplications,
  handleGetApplication
};