const User = require('../models/User'); // Import karo
const TechnicianApplication = require('../models/TechnicianApplication');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');

// POST /api/v1/applications
exports.submitApplication = asyncHandler(async (req, res) => {
  const application = await TechnicianApplication.create(req.body);
  ok(res, { application }, 'Application submitted successfully', 201);
});
exports.listApplications = asyncHandler(async (req, res) => {
  const applications = await TechnicianApplication.find().sort('-createdAt');
  ok(res, { items: applications });
});

// Admin ke liye: Application Approve karo aur User ko Technician banao
exports.approveApplication = asyncHandler(async (req, res) => {
  const application = await TechnicianApplication.findById(req.params.id);
  
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.status === 'approved') throw new ApiError(400, 'Already approved');

  // 1. Check karo ki is email se pehle se koi user hai ya nahi
  let user = await User.findOne({ email: application.email });

  if (user) {
    // Agar user pehle se hai (customer hai), toh uska role technician kar do
    user.role = 'technician';
    user.technician = {
      skills: application.skills,
      isAvailable: true,
      commissionPct: 20,
    };
    await user.save();
  } else {
    // Agar naya user hai, toh naya account banao
    // Note: Password generate karna padega ya user ko invite bhejna padega
    // Filhal hum ek random password set kar rahe hain jo user ko email karna chahiye
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
    // Yahan aap email bhej sakte ho user ko tempPassword ke saath
  }

  // 2. Application ka status 'approved' kar do
  application.status = 'approved';
  await application.save();

  ok(res, { application, user }, 'Application approved and user created as technician');
});