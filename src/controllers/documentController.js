const createError = require("http-errors");

const Application = require("../models/applicationModel");

const deleteOldFile = require("../helpers/deleteOldFile");
const { successResponse } = require("./responseController");


const handleDeleteDocument = async (req, res, next) => {
  try {
    console.log("Received request to delete document:", req.user);
    const userId = req.user._id;
    const { field } = req.params; // transcript, passportCopy etc

    console.log(`Request to delete document field: ${field} for user ${userId}`);

    const application = await Application.findOne({ user: userId });
    if (!application) throw createError(404, "Application not found");

    const document = application.documents[field];
    if (!document) throw createError(400, "Invalid document field");

    // Only allow delete if uploaded or rejected
    if (!["uploaded", "rejected"].includes(document.status)) {
      throw createError(403, "Cannot delete this document right now.");
    }

    // Delete physical file
    if (document.url) {
      deleteOldFile(document.url);
    }

    // Reset document field
    application.documents[field] = {
      url: null,
      status: "not_uploaded",
      feedback: null,
      uploadedAt: null,
    };

    await application.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Document deleted successfully",
      payload: { documents: application.documents },
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleDeleteDocument,
};

