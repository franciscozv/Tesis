import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para Tipo de Actividad
 */
export const TipoActividadSchema = z.object({
  id_tipo: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'Culto dominical' }),
  descripcion: z.string().nullable().openapi({ example: 'Servicio principal del domingo' }),
  color: z.string().openapi({ example: '#3B82F6' }),
  activo: z.boolean().openapi({ example: true }),
  created_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  updated_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type TipoActividad = z.infer<typeof TipoActividadSchema>;

/**
 * Schema para crear un Tipo de Actividad
 */
export const CreateTipoActividadSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .openapi({ example: 'Culto dominical' }),
    descripcion: z.string().optional().openapi({ example: 'Servicio principal del domingo' }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido (ej: #3B82F6)')
      .openapi({ example: '#3B82F6' }),
  }),
});

/**
 * Schema para obtener un Tipo de Actividad por ID
 */
export const GetTipoActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para cambiar estado (activo/inactivo) de un Tipo de Actividad
 * PATCH /api/tipos-actividad/:id/toggle-estado
 */
export const ToggleEstadoTipoActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Tipo de Actividad
 */
export const UpdateTipoActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .optional()
      .openapi({ example: 'Culto dominical' }),
    descripcion: z.string().optional().openapi({ example: 'Servicio principal del domingo' }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido (ej: #3B82F6)')
      .optional()
      .openapi({ example: '#3B82F6' }),
  }),
});
