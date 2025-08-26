import { b } from 'vitest/dist/chunks/suite.d.FvehnV49.js';
import { z } from 'zod';

// Update User
export const updateUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(3, 'First name must be at least 3 characters')
      .optional(),
    lastName: z.string().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format') // allows + and 10–15 digits
      .optional(),
  }),
});

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;
export type updateUserSchemaDataType = z.infer<typeof updateUserSchema>['body'];
