import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Estados permitidos para necesidades logísticas
 */
export const ESTADOS_NECESIDAD = ['abierta', 'cubierta', 'cerrada'] as const;

/**
 * Schema para Necesidad Logística
 */
export const NecesidadLogisticaSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  actividad_id: z.number().openapi({ example: 1 }),
  tipo_necesidad_id: z.number().openapi({ example: 1 }),
  descripcion: z.string().openapi({ example: 'Pan para la santa cena' }),
  cantidad_requerida: z.number().openapi({ example: 50 }),
  unidad_medida: z.string().openapi({ example: 'unidades' }),
  cantidad_cubierta: z.number().openapi({ example: 0 }),
  estado: z.enum(ESTADOS_NECESIDAD).openapi({ example: 'abierta' }),
  fecha_registro: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type NecesidadLogistica = z.infer<typeof NecesidadLogisticaSchema>;

/**
 * Schema para crear una Necesidad Logística
 */
export const CreateNecesidadLogisticaSchema = z.object({
  body: z.object({
    actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
    tipo_necesidad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
    descripcion: z
      .string()
      .min(1, 'Descripción es obligatoria')
      .max(1000, 'Descripción no puede exceder 1000 caracteres')
      .openapi({ example: 'Pan para la santa cena' }),
    cantidad_requerida: z
      .number()
      .positive('Cantidad requerida debe ser mayor a 0')
      .openapi({ example: 50 }),
    unidad_medida: z
      .string()
      .min(1, 'Unidad de medida es obligatoria')
      .max(50, 'Unidad de medida no puede exceder 50 caracteres')
      .openapi({ example: 'unidades' }),
  }),
});

/**
 * Schema para obtener una Necesidad Logística por ID
 */
export const GetNecesidadLogisticaSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar una Necesidad Logística
 */
export const UpdateNecesidadLogisticaSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    tipo_necesidad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    descripcion: z
      .string()
      .min(1, 'Descripción es obligatoria')
      .max(1000, 'Descripción no puede exceder 1000 caracteres')
      .optional()
      .openapi({ example: 'Pan para la santa cena' }),
    cantidad_requerida: z
      .number()
      .positive('Cantidad requerida debe ser mayor a 0')
      .optional()
      .openapi({ example: 50 }),
    unidad_medida: z
      .string()
      .min(1, 'Unidad de medida es obligatoria')
      .max(50, 'Unidad de medida no puede exceder 50 caracteres')
      .optional()
      .openapi({ example: 'unidades' }),
  }),
});

/**
 * Schema para cambiar el estado de una Necesidad Logística
 */
export const PatchEstadoNecesidadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    estado: z
      .enum(ESTADOS_NECESIDAD, {
        errorMap: () => ({
          message: 'Estado debe ser: abierta, cubierta o cerrada',
        }),
      })
      .openapi({ example: 'cubierta' }),
  }),
});

/**
 * Schema de resumen de actividad para necesidades abiertas
 */
export const ActividadResumenSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  lugar: z.string(),
});

/**
 * Schema de resumen de tipo de necesidad para necesidades abiertas
 */
export const TipoNecesidadResumenSchema = z.object({
  id_tipo: z.number(),
  nombre: z.string(),
});

/**
 * Schema para necesidades abiertas (incluye datos de actividad y tipo)
 */
export const NecesidadAbiertaSchema = NecesidadLogisticaSchema.extend({
  actividad: ActividadResumenSchema,
  tipo_necesidad: TipoNecesidadResumenSchema.nullable(),
});

export type NecesidadAbierta = z.infer<typeof NecesidadAbiertaSchema>;

/**
 * Schema para filtros de listado (query params)
 */
export const ListNecesidadesQuerySchema = z.object({
  query: z.object({
    estado: z.enum(ESTADOS_NECESIDAD).optional(),
    actividad_id: z
      .string()
      .regex(/^\d+$/, 'actividad_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),
  }),
});
