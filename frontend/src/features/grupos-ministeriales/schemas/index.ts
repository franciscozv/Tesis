import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { z } from 'zod';

dayjs.extend(isSameOrBefore);

const fechaCreacionValidation = z
  .string({ required_error: 'La fecha de creación es obligatoria.' })
  .min(1, 'La fecha de creación es obligatoria.')
  .refine((fecha) => dayjs(fecha).isValid(), { message: 'Debe ser una fecha válida (YYYY-MM-DD).' })
  .refine((fecha) => dayjs(fecha).isSameOrBefore(dayjs(), 'day'), {
    message: 'La fecha de creación no puede ser futura.',
  });

export const createGrupoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  lider_principal_id: z.number().int().positive('Debe seleccionar un líder'),
  descripcion: z.string().or(z.literal('')).optional(),
  fecha_creacion: fechaCreacionValidation,
});

export const updateGrupoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100).optional(),
  lider_principal_id: z.number().int().positive('Debe seleccionar un líder').optional(),
  descripcion: z.string().or(z.literal('')).optional(),
  fecha_creacion: fechaCreacionValidation.optional(),
});

export type CreateGrupoFormData = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoFormData = z.infer<typeof updateGrupoSchema>;
