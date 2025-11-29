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
     * The value of the award. 
     * (e.g., "$5,000", "Full Tuition Waiver", "20% reduction").
     */
    amount: {
      type: String,
      required: true,
      trim: true,
    },
    
    /**
     * Targeted Audience
     * nationalities: e.g. ["Bangladesh", "Nigeria"] or ["All"]
     * criteria: (e.g., "Open to int students with a GPA of 3.5+ from developing countries.")
     */
    // 
    eligible_nationalities: {
      type: [String], 
      default: ["All"],
    },
    eligibility_criteria: {
      type: String,
      trim: true,
    },
    
    deadline: {
      type: Date,
      index: true, // Important for sorting by "Closing Soon"
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
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