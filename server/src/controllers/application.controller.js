const User = require('../models/User');
const TechnicianApplication = require('../models/TechnicianApplication');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const ApiError = require('../utils/ApiError'); // ✅ YEH IMPORT MISSING THA

// POST /api/v1/applications
exports.submitApplication = asyncHandler(async (req, res) => {
  const application = await TechnicianApplication.create(req.body);
  ok(res, { application }, 'Application submitted successfully', 201);
});

exports.listApplications = asyncHandler(async (req, res) => {
  const applications = await TechnicianApplication.find().sort('-createdAt');
  ok(res, { items: applications });
});

exports.approveApplication = asyncHandler(async (req, res) => {
  const application = await TechnicianApplication.findById(req.params.id);
  
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.status === 'approved') throw new ApiError(400, 'Already approved');

  let user = await User.findOne({ email: application.email });

  if (user) {
    user.role = 'technician';
    user.technician = {
      skills: application.skills,
      isAvailable: true,
      commissionPct: 20,
    };
    await user.save();
  } else {
    const tempPassword = Math.random().toString(36).slice(-8);
    user = await User.create({
      name: application.name,
      email: application.email,
      phone: application.phone,
      role: 'technician',
      passwordHash: await User.hashPassword(tempPassword),
      technician: {
        skills: application.skills,
        isAvailable: true,
        commissionPct: 20,
      },
    });
  }

  application.status = 'approved';
  await application.save();

  ok(res, { application, user }, 'Application approved and user created as technician');
});