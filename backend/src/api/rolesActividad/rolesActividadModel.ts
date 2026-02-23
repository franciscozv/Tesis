import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para Rol de Actividad
 */
export const RolActividadSchema = z.object({
  id_rol: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'Coordinador' }),
  descripcion: z.string().nullable().openapi({ example: 'Coordinador de la actividad' }),
  activo: z.boolean().openapi({ example: true }),
  created_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  updated_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type RolActividad = z.infer<typeof RolActividadSchema>;

/**
 * Schema para crear un Rol de Actividad
 */
export const CreateRolActividadSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .openapi({ example: 'Coordinador' }),
    descripcion: z.string().optional().openapi({ example: 'Coordinador de la actividad' }),
  }),
});

/**
 * Schema para obtener un Rol de Actividad por ID
 */
export const GetRolActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para cambiar estado (activo/inactivo) de un Rol de Actividad
 * PATCH /api/roles-actividad/:id/toggle-estado
 */
export const ToggleEstadoRolActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Rol de Actividad
 */
export const UpdateRolActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .optional()
      .openapi({ example: 'Coordinador' }),
    descripcion: z.string().optional().openapi({ example: 'Coordinador de la actividad' }),
  }),
});
