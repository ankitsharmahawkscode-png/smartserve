const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true }, // HTML or Markdown content
    excerpt: { type: String, maxlength: 300 },
    coverImage: { type: String }, // URL
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    seo: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      keywords: { type: String, default: '', trim: true },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-generate slug from title if not provided
blogSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);