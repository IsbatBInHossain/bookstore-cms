import { z } from 'zod';
import { email } from 'zod/v4';

export const registerSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(3, 'First name must be at least 3 characters'),
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
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password cannot be less than 6 characters'),
  }),
});

// Types
export type registerSchemaType = z.infer<typeof registerSchema>;
export type registerSchemaDataType = z.infer<typeof registerSchema>['body'];
export type loginSchemaType = z.infer<typeof loginSchema>;
export type loginSchemaDataType = z.infer<typeof loginSchema>['body'];
