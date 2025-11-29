const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    program: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Course must be linked to a program'],
      index: true,
    },
    
    course_name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },

    course_code: {
      type: String,
      trim: true,
    },
    
    description: {
      type: String,
      trim: true,
    },
    
    credits: {
      type: String, // (e.g., "3" or "3-4")
      trim: true,
    },

    is_elective: {
      type: Boolean,
      default: false, // false = Core Course, true = Elective
    },

    semester: {
      type: Number, // e.g., 1, 2, 3...
    },

    // e.g., "Must have completed CSE-100"
    prerequisites: {
      type: String,
      trim: true,
    },

    // Link to PDF syllabus
    syllabus_url: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;