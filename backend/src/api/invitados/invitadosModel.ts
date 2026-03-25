import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Estados permitidos para invitados
 */
export const ESTADOS_INVITADO = ['pendiente', 'confirmado', 'rechazado', 'cancelado'] as const;

/**
 * Schema para Invitado
 */
export const InvitadoSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  actividad_id: z.number().openapi({ example: 1 }),
  miembro_id: z.number().openapi({ example: 5 }),
  responsabilidad_id: z.number().openapi({ example: 2 }),
  estado: z.enum(ESTADOS_INVITADO).openapi({ example: 'pendiente' }),
  motivo_rechazo: z.string().nullable().openapi({ example: null }),
  asistio: z.boolean().openapi({ example: false }),
  fecha_invitacion: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  fecha_respuesta: z.string().nullable().openapi({ example: null }),
  miembro: z
    .object({
      id: z.number(),
      nombre: z.string(),
      apellido: z.string(),
    })
    .optional(),
  rol: z
    .object({
      id_responsabilidad: z.number(),
      nombre: z.string(),
    })
    .optional(),
});

export type Invitado = z.infer<typeof InvitadoSchema>;

/**
 * Schema para crear una invitación
 */
export const CreateInvitadoSchema = z.object({
  body: z.object({
    actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
    miembro_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 5 }),
    responsabilidad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 2 }),
    confirmado: z.boolean().optional().default(false).openapi({
      example: false,
      description: 'Si es true, se crea con estado "confirmado" directamente',
    }),
  }),
});

/**
 * Schema para obtener un Invitado por ID
 */
export const GetInvitadoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para responder a una invitación (confirmar/rechazar)
 */
export const PatchResponderInvitadoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z
    .object({
      estado: z
        .enum(['confirmado', 'rechazado'] as const, {
          errorMap: () => ({
            message: 'Estado debe ser: confirmado o rechazado',
          }),
        })
        .openapi({ example: 'confirmado' }),
      motivo_rechazo: z
        .string()
        .min(1, 'El motivo de rechazo no puede estar vacío')
        .max(500, 'El motivo no puede exceder 500 caracteres')
        .optional()
        .openapi({ example: 'No puedo asistir por compromisos laborales' }),
    })
    .refine(
      (data) => {
        if (data.estado === 'rechazado' && !data.motivo_rechazo) return false;
        return true;
      },
      {
        message: 'El motivo de rechazo es obligatorio cuando el estado es "rechazado"',
        path: ['motivo_rechazo'],
      },
    ),
});

/**
 * Schema para marcar asistencia
 */
export const PatchAsistenciaInvitadoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    asistio: z
      .boolean({ required_error: 'El campo asistio es obligatorio' })
      .openapi({ example: true }),
  }),
});

/**
 * Schema para filtros de listado (query params)
 */
export const ListInvitadosQuerySchema = z.object({
  query: z.object({
    actividad_id: z
      .string()
      .regex(/^\d+$/, 'actividad_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),
    miembro_id: z
      .string()
      .regex(/^\d+$/, 'miembro_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),
    estado: z.enum(ESTADOS_INVITADO).optional(),
  }),
});
