import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para Responsabilidad de Actividad
 */
export const ResponsabilidadActividadSchema = z.object({
  id_responsabilidad: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'Coordinador' }),
  descripcion: z.string().nullable().openapi({ example: 'Coordinador de la actividad' }),
  activo: z.boolean().openapi({ example: true }),
  created_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  updated_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type ResponsabilidadActividad = z.infer<typeof ResponsabilidadActividadSchema>;

/**
 * Schema para crear un Responsabilidad de Actividad
 */
export const CreateResponsabilidadActividadSchema = z.object({
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
 * Schema para obtener un Responsabilidad de Actividad por ID
 */
export const GetResponsabilidadActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para cambiar estado (activo/inactivo) de un Responsabilidad de Actividad
 * PATCH /api/responsabilidades-actividad/:id/toggle-estado
 */
export const ToggleEstadoResponsabilidadActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Responsabilidad de Actividad
 */
export const UpdateResponsabilidadActividadSchema = z.object({
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

