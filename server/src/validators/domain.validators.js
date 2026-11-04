const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const phone = z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number');
const slotRe = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;
const { PERMISSION_KEYS } = require('../config/permissions');
// Accepts an array or a comma-separated string, splits every item on commas,
// trims, drops empties, and always outputs a clean array of keywords.
const keywordsField = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => {
    const list = Array.isArray(v) ? v : [v];
    return list
      .flatMap((s) => s.split(','))
      .map((k) => k.trim())
      .filter(Boolean);
  })
  .pipe(z.array(z.string().max(100)).max(30))
  .optional();

// ----- profile -----
exports.profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
});
const addressSchema = z.object({
  label: z.string().trim().max(30).optional(),
  line1: z.string().trim().min(3, 'Enter the address line').max(150),
  line2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(2, 'Enter the city'),
  state: z.string().trim().max(60).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  isDefault: z.boolean().optional(),
});
exports.addressSchema = addressSchema;
exports.addressUpdateSchema = addressSchema.partial();

// ----- catalog -----
exports.categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
  longDescription: z.string().trim().max(3000).optional(),
  icon: z.string().trim().max(60).optional(),
  isActive: z.boolean().optional(),

  seo: z
    .object({
      title: z.string().trim().max(70).optional(),
      description: z.string().trim().max(160).optional(),
      keywords: z.string().trim().max(300).optional(),
    })
    .optional(),

  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(5).max(200),
        answer: z.string().trim().min(10).max(1000),
      })
    )
    .max(20)
    .optional(),
});
exports.serviceSchema = z.object({
  category: objectId,
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).optional(),
  basePrice: z.number().min(0),
  pricingType: z.enum(['fixed', 'estimate']).optional(),
  durationMins: z.number().int().min(15).max(960).optional(),
  isAvailable: z.boolean().optional(),
  image: z.string().trim().url().optional(),
});

// ----- bookings -----
exports.createBookingSchema = z
  .object({
    serviceId: objectId,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    slot: z.string().regex(slotRe, 'Invalid time slot'),
    addressId: objectId.optional(),
    address: addressSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    paymentMethod: z.enum(['online', 'cod']),
  })
  .refine((d) => d.addressId || d.address, { message: 'Choose a saved address or enter one', path: ['address'] });
exports.cancelSchema = z.object({ reason: z.string().trim().min(3).max(300).optional() });
exports.adminCancelSchema = z.object({ reason: z.string().trim().min(3, 'A reason is required').max(300) });
exports.assignSchema = z.object({ technicianId: objectId });
exports.respondSchema = z.object({ accept: z.boolean(), reason: z.string().trim().max(300).optional() });
exports.statusSchema = z.object({ status: z.enum(['IN_PROGRESS', 'COMPLETED']), finalPrice: z.number().min(0).optional() });
exports.availabilitySchema = z.object({ isAvailable: z.boolean() });

// ----- admin: people -----
exports.technicianSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: phone.optional(),
  password: z.string().min(8).max(72).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number'),
  skills: z.array(z.string().trim().min(1)).max(20).optional(),
  commissionPct: z.number().min(0).max(100).optional(),
});
exports.technicianUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.union([phone, z.literal('')]),
    isActive: z.boolean(),
    isAvailable: z.boolean(),
    skills: z.array(z.string().trim().min(1)).max(20),
    commissionPct: z.number().min(0).max(100),
  })
  .partial();
exports.statusToggleSchema = z.object({ isActive: z.boolean() });

// ----- admin: settings -----
exports.settingsSchema = z
  .object({
    slots: z.array(z.string().regex(slotRe, 'Slots look like 09:00-11:00')).min(1).max(12),
    slotCapacity: z.number().int().min(1).max(100),
    maxAdvanceDays: z.number().int().min(1).max(365),
    minLeadHours: z.number().min(0).max(72),
    codEnabled: z.boolean(),
    cancellation: z.object({ freeHoursBefore: z.number().min(0).max(100000), feePercent: z.number().min(0).max(100) }),
  })
  .partial()
  .strict();

// ----- payments and reviews (Milestone 5) -----
exports.orderSchema = z.object({ bookingId: objectId });
exports.verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(5).max(100),
  razorpay_payment_id: z.string().min(5).max(100),
  razorpay_signature: z.string().min(10).max(200),
});
exports.reviewSchema = z.object({
  bookingId: objectId,
  rating: z.number().int().min(1, 'Choose a rating from 1 to 5').max(5),
  comment: z.string().trim().max(1000).optional(),
});
exports.reviewVisibilitySchema = z.object({ isHidden: z.boolean() });

// ----- account security (Milestone 6) -----
exports.changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .regex(/[A-Za-z]/, 'Password must include a letter')
      .regex(/\d/, 'Password must include a number'),
  })
  .refine((d) => d.currentPassword !== d.newPassword, { path: ['newPassword'], message: 'New password must be different' });

// ----- contact form (Milestone 7) -----
exports.contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.union([phone, z.literal('')]).optional().transform((v) => v || undefined),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
  website: z.string().max(200).optional(), // hidden honeypot field
});

// ----- blog -----
exports.blogSchema = z.object({
  title: z.string().trim().min(5).max(150),
  slug: z.string().trim().optional(),
  content: z.string().trim().min(50), // Require at least some content
  excerpt: z.string().trim().max(300).optional(),
  coverImage: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  seo: z
    .object({
      title: z.string().trim().max(70).optional(),
      description: z.string().trim().max(160).optional(),
      keywords: keywordsField,
    })
    .optional(),
});
// ----- admin author profile -----
const urlOrEmpty = z.union([z.string().trim().url(), z.literal('')]).default('');

exports.adminProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.union([phone, z.literal('')]).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens'),
  designation: z.string().trim().min(2).max(80),
  workplace: z.string().trim().max(100).default(''),
  location: z.string().trim().max(100).default(''),
  avatar: z
    .string()
    .max(150000)
    .refine(
      (v) => v === '' || v.startsWith('data:image/') || /^https?:\/\//.test(v),
      'Invalid image'
    )
    .default(''),
  about: z.array(z.string().trim().min(1).max(1500)).max(10).default([]),
  social: z
    .object({
      linkedin: urlOrEmpty,
      twitter: urlOrEmpty,
      facebook: urlOrEmpty,
      instagram: urlOrEmpty,
      website: urlOrEmpty,
    })
    .default({}),
});
// ----- admin staff -----
const permissionList = z.array(z.enum(PERMISSION_KEYS)).max(PERMISSION_KEYS.length);
const staffPassword = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/, 'Include a letter')
  .regex(/\d/, 'Include a number');

exports.staffCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.union([phone, z.literal('')]).optional(),
  password: staffPassword,
  permissions: permissionList.default([]),
});

exports.staffUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.union([phone, z.literal('')]),
    isActive: z.boolean(),
    permissions: permissionList,
  })
  .partial();

exports.staffPasswordSchema = z.object({ password: staffPassword });
// ----- technician self profile -----
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

exports.technicianProfileSchema = z
  .object({
    phone: z.union([phone, z.literal('')]).default(''),
    city: z.string().trim().max(80).default(''),
    bio: z.string().trim().max(600).default(''),
    experienceYears: z.number().int().min(0).max(60).default(0),
    skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    serviceAreas: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    workingDays: z.array(z.enum(DAYS)).max(7).default([]),
    workStart: z.string().regex(timeRe, 'Use HH:MM').default('09:00'),
    workEnd: z.string().regex(timeRe, 'Use HH:MM').default('19:00'),
    avatar: z
      .string()
      .max(150000)
      .refine(
        (v) => v === '' || v.startsWith('data:image/') || /^https?:\/\//.test(v),
        'Invalid image'
      )
      .default(''),
  })
  .refine((d) => d.workStart < d.workEnd, { path: ['workEnd'], message: 'End time must be after start time' });

  // ----- technician application (public form) -----
exports.applicationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone,
  city: z.string().trim().min(2).max(80),
  experienceYears: z.number().int().min(0).max(60),
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
  message: z.string().trim().max(1000).optional(),
  website: z.string().max(200).optional(), // honeypot
});