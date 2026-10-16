const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    isActive: { type: Boolean, default: true },

    seo: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '', trim: true },
      keywords: { type: String, default: '', trim: true },
    },

    // 👇 NEW
    faqs: [
      {
        question: { type: String, trim: true, maxlength: 200 },
        answer: { type: String, trim: true, maxlength: 1000 },
      },
    ],
  },
  { timestamps: true }
);