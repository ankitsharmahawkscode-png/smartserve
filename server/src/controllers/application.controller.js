const TechnicianApplication = require('../models/TechnicianApplication');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');

// POST /api/v1/applications
exports.submitApplication = asyncHandler(async (req, res) => {
  const application = await TechnicianApplication.create(req.body);
  ok(res, { application }, 'Application submitted successfully', 201);
});