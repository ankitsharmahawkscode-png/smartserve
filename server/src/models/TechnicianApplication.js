const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    skills: { type: [String], required: true },
    experienceYears: { type: Number, required: true },
    city: { type: String, required: true },
    message: { type: String, trim: true },
    status: { 
      type: String, 
      enum: ['pending', 'reviewed', 'approved', 'rejected'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TechnicianApplication', applicationSchema);