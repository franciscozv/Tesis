import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para Tipo de Necesidad Logística
 */
export const TipoNecesidadSchema = z.object({
  id_tipo: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'Alimentos' }),
  descripcion: z.string().nullable().openapi({ example: 'Necesidades de alimentos y bebidas' }),
  activo: z.boolean().openapi({ example: true }),
  created_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  updated_at: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type TipoNecesidad = z.infer<typeof TipoNecesidadSchema>;

/**
 * Schema para crear un Tipo de Necesidad
 */
export const CreateTipoNecesidadSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .openapi({ example: 'Alimentos' }),
    descripcion: z.string().optional().openapi({ example: 'Necesidades de alimentos y bebidas' }),
  }),
});

/**
 * Schema para obtener un Tipo de Necesidad por ID
 */
export const GetTipoNecesidadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para cambiar estado (activo/inactivo) de un Tipo de Necesidad
 * PATCH /api/tipos-necesidad/:id/toggle-estado
 */
export const ToggleEstadoTipoNecesidadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Tipo de Necesidad
 */
export const UpdateTipoNecesidadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .optional()
      .openapi({ example: 'Alimentos' }),
    descripcion: z.string().optional().openapi({ example: 'Necesidades de alimentos y bebidas' }),
  }),
});
