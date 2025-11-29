const mongoose = require("mongoose");
const { Schema } = mongoose;

const agentSchema = new Schema(
  {
    /**
     * A direct reference to the User model.
     * Link to the User account (Auth details).
     * This enforces a unique one-to-one relationship:
     * one User document corresponds to one Agent profile.
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Agent profile must be linked to a user"],
      unique: true,
      index: true,
    },

    /**
     * A public-facing biography for the agent,
     * which can be shown to students or used in admin panels.
     */
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot be more than 1000 characters'],
      default: '',
    },

    /**
     * An array of strings describing the agent's areas of expertise.
     * E.g., ["STEM Applications", "Canadian Visas", "Ivy League Admissions", "Scholarship Guidance"]
     * Allows for easy filtering and assignment.
     */
    specializations: {
      type: [String],
      default: [],
    },
    // Performance Metrics
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      index: true,
    },
    review_count: {
      type: Number,
      default: 0,
    },
    
    /**
     * Manages the agent's availability.
     * - 'active': Default, available for assignments.
     * - 'inactive': Deactivated, not shown in lists, not assignable.
     * - 'on_leave': Temporarily unavailable for new assignments.
     */
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
      required: true,
      index: true, 
    },

    // To prevent burnout/overloading
    active_students_limit: {
      type: Number,
      default: 20,
    },
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }, 
  }
);

/**
 * VIRTUAL: applications
 * Creates a virtual field 'applications' on the agent model.
 * This field can be populated to get all applications assigned to this agent.
 */
agentSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id', 
  foreignField: 'agent', 
  count: true, // Only return the number
  match: { status: { $in: ['submitted', 'accepted'] } } // Only count active ones
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;