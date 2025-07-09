import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const PeopleSchema = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  address: z.string(),
  phone: z.string(),
  baptismDate: z.date(),
  convertionDate: z.date(),
  birthdate: z.date(),
  gender: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type People = z.infer<typeof PeopleSchema>;

const PeopleValidationSchema = z.object({
  firstname: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres")
    .regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras"),
  lastname: z
    .string()
    .min(3, "El apellido debe tener al menos 3 caracteres")
    .max(50, "El apellido debe tener como máximo 50 caracteres")
    .regex(/^[a-zA-Z\s]+$/, "El apellido solo puede contener letras"),
  address: z.string().min(1, "La dirección es requerida"),
  phone: z
    .string()
    .min(9, "El teléfono debe tener 9 dígitos")
    .max(9, "El teléfono debe tener 9 dígitos")
    .regex(/^[0-9]+$/, "El teléfono solo puede contener números"),
  baptismDate: z.coerce
    .date()
    .max(new Date(), { message: "La fecha de bautismo debe ser en el pasado" }),
  convertionDate: z.coerce
    .date()
    .max(new Date(), {
      message: "La fecha de conversión debe ser en el pasado",
    }),
  birthdate: z.coerce
    .date()
    .max(new Date(), {
      message: "La fecha de nacimiento debe ser en el pasado",
    }),
  gender: z.string(),
});

export const CreatePeopleSchema = z.object({
  body: PeopleValidationSchema,
});
export type CreatePeopleInput = z.infer<typeof CreatePeopleSchema.shape.body>;

export const UpdatePeopleSchema = z.object({
  body: PeopleValidationSchema.partial(),
  params: z.object({ id: commonValidations.id }),
});
export type UpdatePeopleInput = z.infer<typeof UpdatePeopleSchema.shape.body>;

export const GetPeopleSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
