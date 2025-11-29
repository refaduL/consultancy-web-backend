const mongoose = require("mongoose");
const { Schema } = mongoose;

const intakeSchema = new Schema({
  season: {
    type: String,
    required: true,
    enum: ['Fall', 'Spring', 'Summer', 'Winter', 'Rolling'],
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  start_date: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'waitlist'],
    default: 'open',
  },
}, { _id: false });


const programSchema = new Schema(
  {
    university: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      required: [true, 'Program must be linked to a university'],
      index: true,
    },
    program_name: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
    degree_level: {
      type: String,
      required: true,
      enum: ["Bachelor's", "Master's", "PhD", "Diploma", "Certificate", "Associate"],
      index: true, // Index for filtering
    },
    field_of_study: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index for filtering
    },
    study_mode: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Online', 'Hybrid'],
      default: 'Full-time',
      index: true,
    },
    language_of_instruction: {
      type: [String], 
      default: ["English"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    career_prospects: { // "Graduates often work at Google, Amazon..."
      type: String,
      trim: true,
    },
    duration: {
      type: String, // Flexible, e.g., "2 years", "18 months"
      required: true,
      trim: true,
    },
    // Tuition Breakdown
    tuition_fee: {
      type: Number,
      index: true, // Index for range-based filtering (e.g., fee < 20000)
    },
    tuition_fee_type: {
      type: String,
      enum: ['Per Year', 'Per Semester', 'Total Program Fee', 'Per Credit'],
      default: 'Per Year',
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    program_url: {
      type: String,
      trim: true,
    },
    requirements: {
      gpa: { type: String, trim: true },
      ielts: { type: Number, min: 0, max: 9 },
      toefl: { type: Number, min: 0, max: 120 },
      gre: { type: Number, min: 260, max: 340 },
      gmat: { type: Number, min: 200, max: 800 },
      work_experience_years: { type: Number, default: 0 }, // MBA programs often need this
      other: { type: String, trim: true },
    },
    intakes: {
      type: [intakeSchema],
      default: [],
    },
  },
  {
    // Mongoose options
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * VIRTUAL: courses
 * Creates a virtual field 'courses' on the program model.
 * This can be populated to get all courses that are part of this program.
 */
programSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'program',
});

/**
 * VIRTUAL: scholarships
 * Creates a virtual field 'scholarships' on the program model.
 * This can be populated to get all scholarships specific to this program.
 */
programSchema.virtual('scholarships', {
  ref: 'Scholarship',
  localField: '_id',
  foreignField: 'program',
});

const Program = mongoose.model('Program', programSchema);

module.exports = Program;