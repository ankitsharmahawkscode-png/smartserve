const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300 },
    icon: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
     seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: { type: String, default: '' }, // comma-separated
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', schema);