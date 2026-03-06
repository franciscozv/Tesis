import { z } from 'zod';

export const frecuenciaEnum = z.enum([
  'semanal',
  'primera_semana',
  'segunda_semana',
  'tercera_semana',
  'cuarta_semana',
]);

export const createPatronSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  tipo_actividad_id: z.coerce.number().int().positive('Seleccione un tipo de actividad'),
  frecuencia: frecuenciaEnum,
  dia_semana: z.coerce.number().int().min(1, 'Mínimo 1').max(7, 'Máximo 7'),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato HH:MM'),
  duracion_minutos: z.coerce.number().int().positive('La duración debe ser mayor a 0'),
  lugar: z.string().min(1, 'El lugar es requerido').max(200, 'Máximo 200 caracteres'),
  grupo_id: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(0).transform(() => undefined)),
  es_publica: z.boolean().default(false),
});

export const updatePatronSchema = createPatronSchema.partial();

export const generarInstanciasSchema = z.object({
  mes: z.coerce.number().int().min(1, 'Mes inválido').max(12, 'Mes inválido'),
  anio: z.coerce.number().int().min(2020, 'Año mínimo: 2020').max(2100, 'Año máximo: 2100'),
});

export type CreatePatronFormData = z.infer<typeof createPatronSchema>;
export type UpdatePatronFormData = z.infer<typeof updatePatronSchema>;
export type GenerarInstanciasFormData = z.infer<typeof generarInstanciasSchema>;

