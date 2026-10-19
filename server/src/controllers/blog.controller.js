const Blog = require('../models/Blog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

// --- ADMIN ONLY ---
exports.createBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.create({ ...req.body, author: req.user._id });
  if (blog.isPublished) blog.publishedAt = new Date();
  await blog.save();
  ok(res, { blog }, 'Blog post created', 201);
});

exports.updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!blog) throw new ApiError(404, 'Blog post not found');
  
  if (blog.isPublished && !blog.publishedAt) {
    blog.publishedAt = new Date();
    await blog.save();
  }
  ok(res, { blog }, 'Blog post updated');
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(404, 'Blog post not found');
  ok(res, null, 'Blog post deleted');
});

exports.adminListBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().sort('-createdAt').populate('author', 'name');
  ok(res, { items: blogs });
});

// --- PUBLIC ---
exports.listPublishedBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ isPublished: true })
    .sort('-publishedAt')
    .select('-content')
    .populate('author', 'name');
  ok(res, { items: blogs });
});

exports.getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
    .populate('author', 'name');
  if (!blog) throw new ApiError(404, 'Blog post not found');
  ok(res, { blog });
});