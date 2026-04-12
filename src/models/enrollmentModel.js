// models/Enrollment.model.js
const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // from form — hardcoded frontend values
    courseId: {
      type: String,
      required: true,
      enum: ["ielts", "toefl", "pte"],
    },
    courseName: {
      type: String,
      required: true, // "IELTS Preparation"
    },
    batchName: {
      type: String,
      required: true,
      enum: [
        "Morning Batch (09:00 – 11:00 · Mon/Wed/Fri)",
        "Evening Batch (18:00 – 20:00 · Tue/Thu/Sat)",
        "Weekend Batch (10:00 – 16:00 · Sat/Sun)",
      ],
    },
    currentScore: {
      type: String,
      default: null, // optional — "Band 5.5", "72", etc.
    },
    targetScore: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },

    // managed server-side
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// one active enrollment per user per course
EnrollmentSchema.index(
  { user: 1, courseId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "cancelled" } },
  }
);

const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);

module.exports = Enrollment;