import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { z } from 'zod';

dayjs.extend(isSameOrBefore);

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal para Grupo Ministerial
 */
export const GrupoMinisterialSchema = z.object({
  id_grupo: z.number(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  fecha_creacion: z.string(), // ISO date string
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GrupoMinisterial = z.infer<typeof GrupoMinisterialSchema>;

export const EncargadoActualSchema = z.object({
  miembro_id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
});

export type EncargadoActual = z.infer<typeof EncargadoActualSchema>;

export const GrupoConEncargadoSchema = GrupoMinisterialSchema.extend({
  encargado_actual: EncargadoActualSchema.nullable(),
});

export type GrupoConEncargado = z.infer<typeof GrupoConEncargadoSchema>;

/**
 * Schema para obtener un grupo ministerial por ID
 */
export const GetGrupoMinisterialSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para crear un nuevo grupo ministerial
 */
export const CreateGrupoMinisterialSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(2, 'Nombre debe tener mínimo 2 caracteres')
      .max(100, 'Nombre debe tener máximo 100 caracteres'),
    descripcion: z
      .string()
      .optional()
      .transform((val) => val || null),
    fecha_creacion: z
      .string({ required_error: 'La fecha de creación es obligatoria.' })
      .date('Debe ser una fecha válida (YYYY-MM-DD)')
      .refine((fecha) => dayjs(fecha).isSameOrBefore(dayjs(), 'day'), {
        message: 'La fecha de creación no puede ser futura.',
      }),
  }),
});

/**
 * Schema para actualizar un grupo ministerial existente
 */
export const UpdateGrupoMinisterialSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(2, 'Nombre debe tener mínimo 2 caracteres')
      .max(100, 'Nombre debe tener máximo 100 caracteres')
      .optional(),
    descripcion: z
      .string()
      .optional()
      .transform((val) => val || null),
  }),
});

/**
 * Schema para asignar / cambiar el encargado de un grupo ministerial
 * PUT /api/grupos-ministeriales/:id/encargado
 */
export const AsignarEncargadoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nuevo_miembro_id: z
      .number({ required_error: 'El miembro es obligatorio.' })
      .int()
      .positive('El miembro debe ser un ID válido.'),
    fecha: z.string().date('Debe ser una fecha válida (YYYY-MM-DD)').optional(),
    motivo: z.string().optional(),
  }),
});
