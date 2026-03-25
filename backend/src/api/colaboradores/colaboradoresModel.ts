import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para Colaborador (compromiso de colaboración confirmado)
 */
export const ColaboradorSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  necesidad_id: z.number().openapi({ example: 1 }),
  miembro_id: z.number().openapi({ example: 5 }),
  cantidad_comprometida: z.number().openapi({ example: 10 }),
  observaciones: z.string().nullable().openapi({ example: 'Puedo traer pan casero' }),
  cumplio: z.boolean().openapi({ example: false }),
  fecha_compromiso: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type Colaborador = z.infer<typeof ColaboradorSchema>;

/**
 * Schema para registrar un compromiso de colaboración
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
    cantidad_comprometida: z
      .number()
      .positive('Cantidad comprometida debe ser mayor a 0')
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
 * Schema para marcar si un colaborador cumplió su compromiso
 */
export const PatchCumplioColaboradorSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    cumplio: z.boolean().openapi({ example: true }),
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
  }),
});
