import { z } from 'zod';

export const estadoActividadEnum = z.enum(['programada', 'realizada', 'cancelada']);

export const createActividadSchema = z
  .object({
    tipo_actividad_id: z.coerce.number().int().positive('Seleccione un tipo de actividad'),
    nombre: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
    descripcion: z.string().or(z.literal('')).optional(),
    fecha: z
      .string()
      .min(1, 'La fecha es requerida')
      .refine((val) => val >= new Date().toISOString().slice(0, 10), {
        message: 'La fecha no puede ser anterior a hoy',
      }),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM'),
    hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM'),
    lugar: z.string().min(1, 'El lugar es requerido').max(200, 'Máximo 200 caracteres'),
    grupo_id: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal(0).transform(() => undefined)),
    es_publica: z.boolean().default(false),
  })
  .refine((data) => data.hora_fin > data.hora_inicio, {
    message: 'La hora de fin debe ser mayor a la hora de inicio',
    path: ['hora_fin'],
  });

export const updateActividadSchema = z
  .object({
    tipo_actividad_id: z.coerce
      .number()
      .int()
      .positive('Seleccione un tipo de actividad')
      .optional(),
    nombre: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(150, 'Máximo 150 caracteres')
      .optional(),
    descripcion: z.string().or(z.literal('')).optional(),
    fecha: z.string().optional(),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM')
      .optional(),
    hora_fin: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM')
      .optional(),
    lugar: z.string().min(1, 'El lugar es requerido').max(200, 'Máximo 200 caracteres').optional(),
    grupo_id: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal(0).transform(() => undefined)),
    es_publica: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.hora_inicio && data.hora_fin) {
        return data.hora_fin > data.hora_inicio;
      }
      return true;
    },
    {
      message: 'La hora de fin debe ser mayor a la hora de inicio',
      path: ['hora_fin'],
    },
  );

export const cambiarEstadoActividadSchema = z
  .object({
    estado: estadoActividadEnum,
    motivo_cancelacion: z.string().min(1).max(500).or(z.literal('')).optional(),
  })
  .refine((data) => data.estado !== 'cancelada' || !!data.motivo_cancelacion, {
    message: 'El motivo es requerido al cancelar',
    path: ['motivo_cancelacion'],
  });

export const reprogramarActividadSchema = z
  .object({
    fecha: z
      .string()
      .min(1, 'La fecha es requerida')
      .refine((val) => val >= new Date().toISOString().slice(0, 10), {
        message: 'La fecha no puede ser anterior a hoy',
      }),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM'),
    hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM'),
  })
  .refine((data) => data.hora_fin > data.hora_inicio, {
    message: 'La hora de fin debe ser mayor a la hora de inicio',
    path: ['hora_fin'],
  });

export type CreateActividadFormData = z.infer<typeof createActividadSchema>;
export type UpdateActividadFormData = z.infer<typeof updateActividadSchema>;
export type CambiarEstadoActividadFormData = z.infer<typeof cambiarEstadoActividadSchema>;
export type ReprogramarActividadFormData = z.infer<typeof reprogramarActividadSchema>;
