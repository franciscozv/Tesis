import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Estados de membresía permitidos
 */
export const ESTADOS_COMUNION = ['asistente', 'probando', 'plena_comunion'] as const;

/**
 * Schema para Historial de Estado de Membresía
 */
export const HistorialEstadoSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  miembro_id: z.number().openapi({ example: 5 }),
  estado_anterior: z.enum(ESTADOS_COMUNION).openapi({ example: 'asistente' }),
  estado_nuevo: z.enum(ESTADOS_COMUNION).openapi({ example: 'probando' }),
  motivo: z
    .string()
    .openapi({ example: 'El miembro ha completado el periodo de prueba satisfactoriamente' }),
  usuario_id: z.number().openapi({ example: 1 }),
  fecha_cambio: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type HistorialEstado = z.infer<typeof HistorialEstadoSchema>;

/**
 * Schema para crear un registro de cambio de estado
 */
export const CreateHistorialEstadoSchema = z.object({
  body: z
    .object({
      miembro_id: z
        .number()
        .int('Debe ser un número entero')
        .positive('Debe ser un ID válido')
        .openapi({ example: 5 }),
      estado_anterior: z
        .enum(ESTADOS_COMUNION, {
          errorMap: () => ({
            message: 'Estado debe ser: asistente, probando o plena_comunion',
          }),
        })
        .openapi({ example: 'asistente' }),
      estado_nuevo: z
        .enum(ESTADOS_COMUNION, {
          errorMap: () => ({
            message: 'Estado debe ser: asistente, probando o plena_comunion',
          }),
        })
        .openapi({ example: 'probando' }),
      motivo: z
        .string()
        .min(10, 'El motivo debe tener al menos 10 caracteres')
        .max(1000, 'El motivo no puede exceder 1000 caracteres')
        .openapi({ example: 'El miembro ha completado el periodo de prueba satisfactoriamente' }),
      usuario_id: z
        .number()
        .int('Debe ser un número entero')
        .positive('Debe ser un ID válido')
        .openapi({ example: 1 }),
    })
    .refine((data) => data.estado_anterior !== data.estado_nuevo, {
      message: 'El estado nuevo debe ser diferente al estado anterior',
      path: ['estado_nuevo'],
    }),
});

/**
 * Schema para obtener un registro por ID
 */
export const GetHistorialEstadoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para la respuesta con datos del usuario incluidos
 */
export const HistorialEstadoConUsuarioSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  miembro_id: z.number().openapi({ example: 5 }),
  estado_anterior: z.enum(ESTADOS_COMUNION).openapi({ example: 'probando' }),
  estado_nuevo: z.enum(ESTADOS_COMUNION).openapi({ example: 'plena_comunion' }),
  motivo: z.string().openapi({ example: 'Cumplió satisfactoriamente promesas de fidelidad' }),
  usuario: z
    .object({
      id: z.number().openapi({ example: 1 }),
      email: z.string().openapi({ example: 'admin@iepsantajuana.cl' }),
    })
    .openapi({ description: 'Usuario que registró el cambio' }),
  fecha_cambio: z.string().openapi({ example: '2025-02-10T14:30:00' }),
});

export type HistorialEstadoConUsuario = z.infer<typeof HistorialEstadoConUsuarioSchema>;

/**
 * Schema para filtros de listado (query params) - miembro_id obligatorio
 */
export const ListHistorialEstadoQuerySchema = z.object({
  query: z.object({
    miembro_id: z
      .string()
      .regex(/^\d+$/, 'miembro_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive()),
  }),
});
