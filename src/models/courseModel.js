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
    
    /**
     * The number of credits the course is worth.
     * Stored as a string for flexibility (e.g., "3" or "3-4").
     */
    credits: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;