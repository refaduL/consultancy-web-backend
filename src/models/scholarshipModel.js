const mongoose = require("mongoose");
const { Schema } = mongoose;

const scholarshipSchema = new Schema(
  {
    scholarship_name: {
      type: String,
      required: [true, 'Scholarship name is required'],
      trim: true,
    },
    
    university: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      required: [true, 'Scholarship must be linked to a university'],
      index: true,
    },
    
    program: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      default: null,
      index: true,
    },
    
    description: {
      type: String,
      required: true,
      trim: true,
    },
    
    /**
     * The value of the award. Stored as a string for flexibility
     * (e.g., "$5,000", "Full Tuition Waiver", "20% reduction").
     */
    amount: {
      type: String,
      required: true,
      trim: true,
    },
    
    /**
     * A description of the eligibility criteria.
     * (e.g., "Open to int students with a GPA of 3.5+ from developing countries.")
     */
    eligibility_criteria: {
      type: String,
      trim: true,
    },
    
    deadline: {
      type: Date,
    },
    
    scholarship_url: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);

module.exports = Scholarship;