import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

export type PeopleRole = z.infer<typeof PeopleRoleSchema>;
export const PeopleRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()),
});

// Input Validation for 'POST people-roles' endpoint
export const CreatePeopleRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
  }),
});

export const UpdatePeopleRoleSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
  }),
});

// Input Validation for 'GET people-roles/:id' endpoint
export const GetPeopleRoleSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
