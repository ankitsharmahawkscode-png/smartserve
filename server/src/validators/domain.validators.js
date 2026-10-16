const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const phone = z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number');
const slotRe = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

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
  icon: z.string().trim().max(60).optional(),
  isActive: z.boolean().optional(),
  seo: z
    .object({
      title: z.string().trim().max(70, 'Keep the SEO title under 70 characters').optional(),
      description: z
        .string()
        .trim()
        .max(160, 'Keep the meta description under 160 characters')
        .optional(),
      keywords: z.string().trim().max(300, 'Keep keywords under 300 characters').optional(),
    })
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
    phone,
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