require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

(async () => {
  await mongoose.connect(process.env.MONGO_URI); // use the variable name from your .env
  const blogs = await Blog.find({});
  let fixed = 0;

  for (const b of blogs) {
    const raw = b.seo?.keywords || [];
    const list = Array.isArray(raw) ? raw : [raw];
    const clean = list
      .flatMap((k) => String(k).split(','))
      .map((k) => k.trim())
      .filter(Boolean);

    if (JSON.stringify(clean) !== JSON.stringify(raw)) {
      b.seo.keywords = clean;
      await b.save();
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} of ${blogs.length} posts`);
  await mongoose.disconnect();
})();