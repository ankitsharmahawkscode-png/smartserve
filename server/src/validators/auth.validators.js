const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number');

exports.registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  phone: z
    .union([z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number'), z.literal('')])
    .optional()
    .transform((v) => v || undefined),
  password,
});

exports.loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

exports.forgotPasswordSchema = z.object({ email });

exports.resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'This reset link is not valid'),
  newPassword: password,
});