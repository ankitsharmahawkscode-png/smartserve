import { z } from 'zod';

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name'),
    email,
    phone: z.string().trim().regex(/^$|^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number'),
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });