import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

export const PeopleSchema = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  address: z.string(),
  phone: z.string(),
  baptismDate: z.coerce.date(),
  convertionDate: z.coerce.date(),
  birthdate: z.coerce.date(),
  gender: z.enum(['MASCULINO', 'FEMENINO']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetPeopleSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const CreatePeopleSchema = z.object({
  body: PeopleSchema.omit({ id: true, createdAt: true, updatedAt: true }),
});

export const UpdatePeopleSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: PeopleSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial(),
});

export type People = z.infer<typeof PeopleSchema>;
export type CreatePeopleInput = z.infer<typeof CreatePeopleSchema>['body'];
export type UpdatePeopleInput = z.infer<typeof UpdatePeopleSchema>['body'];
