import { z } from 'zod';
import { RoleName } from '../../generated/prisma/index.js';

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

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid id format'),
  }),
  body: z.object({
    role: z.preprocess(
      val => (typeof val === 'string' ? val.toUpperCase() : val),
      z.nativeEnum(RoleName, {
        errorMap: () => ({ message: 'Invalid role specified' }),
      })
    ),
  }),
});
