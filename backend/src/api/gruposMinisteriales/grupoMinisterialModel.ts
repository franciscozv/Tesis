import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal para Grupo Ministerial
 */
export const GrupoMinisterialSchema = z.object({
  id_grupo: z.number(),
  lider_principal_id: z.number(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  fecha_creacion: z.string(), // ISO date string
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GrupoMinisterial = z.infer<typeof GrupoMinisterialSchema>;

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
    lider_principal_id: z.number().int().positive('El ID del líder principal es obligatorio'),
    descripcion: z
      .string()
      .optional()
      .transform((val) => val || null),
    fecha_creacion: z
      .string()
      .date('Fecha de creación debe ser una fecha válida (YYYY-MM-DD)')
      .optional(), // Default será la fecha actual en el backend
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
    lider_principal_id: z
      .number()
      .int()
      .positive('El ID del líder principal debe ser un número positivo')
      .optional(),
    descripcion: z
      .string()
      .optional()
      .transform((val) => val || null),
  }),
});
