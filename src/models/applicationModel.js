const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * A sub-document schema for a user's educational background.
 * Using _id: false to save storage, as we won't query entries individually.
 */
const educationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true }, // e.g., "Bachelor of Science"
    fieldOfStudy: { type: String, required: true, trim: true }, // e.g., "Computer Science"
    graduationYear: { type: Number, required: true },
    gpa: { type: String, trim: true }, // Using String for flexibility (e.g., "3.8/4.0" or "85%")
  },
  { _id: false }
);

/**
 * A sub-document schema for internal notes left by agents.
 * We *do* keep the _id here so individual notes can be edited or deleted.
 */
const internalNoteSchema = new Schema({
  agent: {
    type: Schema.Types.ObjectId,
    ref: "Agent",
    required: true,
  },
  note: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * A sub-document schema for tracking individual document status.
 * This allows for per-document review.
 */
const documentStatusSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      feedbackenum: [
        "pending",
        "submitted",
        "approved",
        "rejected_for_revision",
      ],
      default: "pending", // 'pending' = not yet uploaded by user
    },
    feedback: {
      // For agent to provide feedback (e.g., "PDF is blurry")
      type: String,
      trim: true,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
); // _id: false to save space, we'll track by key name

/**
 * NEW: A sub-document schema for tracking individual test scores.
 */
const testScoreSchema = new Schema(
  {
    score: { type: String, trim: true }, // Flexible score e.g., "7.5" or "110/120"
    date: { type: Date },
    url: { type: String, trim: true, default: null }, // Link to score report
  },
  { _id: false }
);

/**
 * The main Application Schema.
 */
const applicationSchema = new Schema(
  {
    /**
     * The student (User) who owns this application.
     * This is a strict one-to-one relationship.
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /**
     * The agent assigned to review this application.
     * This is assigned by an admin or an automated system: which agent responds first.
     */
    agent: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
      index: true,
    },

    // The current lifecycle status of the application (3-stage flow).
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "draft", // Student is filling out the form
          "submitted", // Student submitted, awaiting agent (pending)
          "accepted", // Initial review passed. Docs can be uploaded.
          "approved", // Final approval after doc review.
          "rejected", // Application rejected (at initial or doc stage).
        ],
        message: "{VALUE} is not a supported status.",
      },
      default: "draft",
      index: true,
    },

    /**
     * Feedback provided by the agent if the application is rejected.
     * This field is conditionally required.
     */
    rejectionFeedback: {
      type: String,
      trim: true,
      // Custom validator: 'rejectionFeedback' is required if 'status' is 'rejected'.
      validate: {
        validator: function (v) {
          if (this.status === "rejected") {
            return v && v.length > 0;
          }
          return true;
        },
        message:
          'Rejection feedback is required when the status is "rejected".',
      },
    },

    educationHistory: {
      type: [educationSchema],
      default: [],
    },

    testScores: {
      ielts: { type: testScoreSchema, default: () => ({}) },
      toefl: { type: testScoreSchema, default: () => ({}) },
      gre: { type: testScoreSchema, default: () => ({}) },
      gmat: { type: testScoreSchema, default: () => ({}) },
      duolingo: { type: testScoreSchema, default: () => ({}) },
      pte: { type: testScoreSchema, default: () => ({}) },
      // 'other' can be an array for flexibility
      other: [
        {
          name: { type: String, trim: true },
          score: { type: String, trim: true },
          date: { type: Date },
          url: { type: String, trim: true },
        },
      ],
    },

    /**
     * Student's stated interests (submitted in the initial application).
     */
    preferences: {
      preferredCountries: { type: [String], default: [] },
      preferredFieldOfStudy: { type: String, trim: true, default: "" },
      preferredIntake: { type: String, trim: true, default: "" }, // e.g., "Fall 2026"
    },

    /**
     * URLs to uploaded files (e.g., from S3).
     * These fields will be populated by the user *after* the
     * application status is set to 'approved'.
     * Each document now has its own status and feedback loop.
     */
    documents: {
      transcript: { type: documentStatusSchema, default: () => ({}) },
      statementOfPurpose: { type: documentStatusSchema, default: () => ({}) },
      resume_cv: { type: documentStatusSchema, default: () => ({}) },
      letterOfRecommendation1: {
        type: documentStatusSchema,
        default: () => ({}),
      },
      letterOfRecommendation2: {
        type: documentStatusSchema,
        default: () => ({}),
      },
    },

    // A log of notes visible only to agents and admins.
    internalNotes: {
      type: [internalNoteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
