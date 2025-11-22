const mongoose = require("mongoose");
const { Schema } = mongoose;

const universitySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'University name is required'],
      trim: true,
      unique: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website_url: {
      type: String,
      trim: true,
    },
    logo_url: {
      type: String,
      trim: true,
      default: 'https://placehold.co/400x400/eeeeee/888888?text=University',
    },
    rankings: {
      qs: Number,
      times: Number,
      us_news: Number,
    },
    /**
     * General application deadline information, if one exists.
     * (Specific deadlines will be in the Program model).
     */
    general_application_info: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUAL: programs
universitySchema.virtual('programs', {
  ref: 'Program',
  localField: '_id',
  foreignField: 'university',
});

//  VIRTUAL: scholarships
universitySchema.virtual('scholarships', {
  ref: 'Scholarship',
  localField: '_id',
  foreignField: 'university',
});

const University = mongoose.model('University', universitySchema);

module.exports = University;