import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Estados permitidos para colaboradores
 */
export const ESTADOS_COLABORADOR = ['pendiente', 'aceptada', 'rechazada'] as const;

/**
 * Schema para Colaborador
 */
export const ColaboradorSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  necesidad_id: z.number().openapi({ example: 1 }),
  miembro_id: z.number().openapi({ example: 5 }),
  cantidad_ofrecida: z.number().openapi({ example: 10 }),
  observaciones: z.string().nullable().openapi({ example: 'Puedo traer pan casero' }),
  estado: z.enum(ESTADOS_COLABORADOR).openapi({ example: 'pendiente' }),
  fecha_oferta: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  fecha_decision: z.string().nullable().openapi({ example: null }),
});

export type Colaborador = z.infer<typeof ColaboradorSchema>;

/**
 * Schema para crear un Colaborador (oferta voluntaria)
 */
export const CreateColaboradorSchema = z.object({
  body: z.object({
    necesidad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
    miembro_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 5 }),
    cantidad_ofrecida: z
      .number()
      .positive('Cantidad ofrecida debe ser mayor a 0')
      .openapi({ example: 10 }),
    observaciones: z
      .string()
      .max(500, 'Observaciones no puede exceder 500 caracteres')
      .optional()
      .openapi({ example: 'Puedo traer pan casero' }),
  }),
});

/**
 * Schema para obtener un Colaborador por ID
 */
export const GetColaboradorSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para aceptar/rechazar una oferta
 */
export const PatchDecisionColaboradorSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    estado: z
      .enum(['aceptada', 'rechazada'] as const, {
        errorMap: () => ({
          message: 'Estado debe ser: aceptada o rechazada',
        }),
      })
      .openapi({ example: 'aceptada' }),
  }),
});

/**
 * Schema para filtros de listado (query params)
 */
export const ListColaboradoresQuerySchema = z.object({
  query: z.object({
    necesidad_id: z
      .string()
      .regex(/^\d+$/, 'necesidad_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),
    miembro_id: z
      .string()
      .regex(/^\d+$/, 'miembro_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),
    estado: z.enum(ESTADOS_COLABORADOR).optional(),
  }),
});
