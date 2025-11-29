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
    // Adding native name for search optimization (e.g., "Technische Universität München")
    native_name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Public', 'Private', 'Semi-Private'],
      default: 'Public',
      index: true,
    },
    established_year: {
      type: Number,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website_url: {
      type: String,
      trim: true,
    },
    // Media
    logo_url: {
      type: String,
      default: 'https://placehold.co/400x400/eeeeee/888888?text=University',
    },
    gallery: {
      type: [String], // Array of image URLs for campus slider
      default: [],
    },
    // Rankings
    rankings: {
      qs: { type: Number, default: null },
      times: { type: Number, default: null },
      us_news: { type: Number, default: null },
    },
    // Contact for Admissions (Helpful for agents)
    contact_info: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true }, // Full street address
    },
    /**
     * General application deadline information, if one exists.
     * (Specific deadlines will be in the Program model).
     */
    general_application_info: {
      type: String,
      trim: true,
    },
    // Key Selling Points
    // e.g. ["On-campus Housing", "Library", "Sports Facilities"]
    facilities: {
      type: [String],
      default: [],
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