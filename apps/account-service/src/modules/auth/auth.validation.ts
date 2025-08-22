import { z } from 'zod';

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(3, 'First name must be at least 3 characters')
      .regex(/^[A-Za-z]+$/, 'First name must only contain letters'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password cannot be less than 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    phone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format') // allows + and 10–15 digits
      .optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
