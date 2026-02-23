import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Valores permitidos para frecuencia
 */
export const FRECUENCIAS = [
  'semanal',
  'primera_semana',
  'segunda_semana',
  'tercera_semana',
  'cuarta_semana',
] as const;

/**
 * Schema para Patrón de Actividad
 */
export const PatronActividadSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'Culto dominical matutino' }),
  tipo_actividad_id: z.number().openapi({ example: 1 }),
  frecuencia: z.enum(FRECUENCIAS).openapi({ example: 'semanal' }),
  dia_semana: z.number().min(1).max(7).openapi({ example: 7, description: '1=lunes, 7=domingo' }),
  hora_inicio: z.string().openapi({ example: '10:00:00' }),
  duracion_minutos: z.number().positive().openapi({ example: 90 }),
  lugar: z.string().openapi({ example: 'Templo principal' }),
  grupo_id: z.number().nullable().openapi({ example: null }),
  es_publica: z.boolean().openapi({ example: false }),
  activo: z.boolean().openapi({ example: true }),
  fecha_creacion: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type PatronActividad = z.infer<typeof PatronActividadSchema>;

/**
 * Schema para crear un Patrón de Actividad
 */
export const CreatePatronActividadSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .openapi({ example: 'Culto dominical matutino' }),
    tipo_actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
    frecuencia: z
      .enum(FRECUENCIAS, {
        errorMap: () => ({
          message:
            'Frecuencia debe ser: semanal, primera_semana, segunda_semana, tercera_semana o cuarta_semana',
        }),
      })
      .openapi({ example: 'semanal' }),
    dia_semana: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Día de semana debe ser entre 1 (lunes) y 7 (domingo)')
      .max(7, 'Día de semana debe ser entre 1 (lunes) y 7 (domingo)')
      .openapi({ example: 7 }),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .openapi({ example: '10:00' }),
    duracion_minutos: z
      .number()
      .int('Debe ser un número entero')
      .positive('Duración debe ser mayor a 0')
      .openapi({ example: 90 }),
    lugar: z
      .string()
      .min(1, 'Lugar es obligatorio')
      .max(200, 'Lugar no puede exceder 200 caracteres')
      .openapi({ example: 'Templo principal' }),
    grupo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    es_publica: z.boolean().default(false).openapi({ example: false }),
  }),
});

/**
 * Schema para obtener un Patrón de Actividad por ID
 */
export const GetPatronActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Patrón de Actividad
 */
export const UpdatePatronActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .optional()
      .openapi({ example: 'Culto dominical matutino' }),
    tipo_actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    frecuencia: z
      .enum(FRECUENCIAS, {
        errorMap: () => ({
          message:
            'Frecuencia debe ser: semanal, primera_semana, segunda_semana, tercera_semana o cuarta_semana',
        }),
      })
      .optional()
      .openapi({ example: 'semanal' }),
    dia_semana: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Día de semana debe ser entre 1 (lunes) y 7 (domingo)')
      .max(7, 'Día de semana debe ser entre 1 (lunes) y 7 (domingo)')
      .optional()
      .openapi({ example: 7 }),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .optional()
      .openapi({ example: '10:00' }),
    duracion_minutos: z
      .number()
      .int('Debe ser un número entero')
      .positive('Duración debe ser mayor a 0')
      .optional()
      .openapi({ example: 90 }),
    lugar: z
      .string()
      .min(1, 'Lugar es obligatorio')
      .max(200, 'Lugar no puede exceder 200 caracteres')
      .optional()
      .openapi({ example: 'Templo principal' }),
    grupo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .nullable()
      .optional()
      .openapi({ example: 1 }),
    es_publica: z.boolean().optional().openapi({ example: false }),
  }),
});

/**
 * Schema para activar/desactivar un Patrón de Actividad
 */
/**
 * Schema para generar instancias de actividades desde patrones
 */
export const GenerarInstanciasSchema = z.object({
  body: z.object({
    mes: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Mes debe ser entre 1 y 12')
      .max(12, 'Mes debe ser entre 1 y 12')
      .openapi({ example: 3 }),
    anio: z
      .number()
      .int('Debe ser un número entero')
      .min(2020, 'Año debe ser mayor o igual a 2020')
      .max(2100, 'Año debe ser menor o igual a 2100')
      .openapi({ example: 2025 }),
  }),
});

/**
 * Schema para la respuesta de generar instancias
 */
export const GenerarInstanciasResponseSchema = z.object({
  total_patrones: z.number().openapi({ example: 5 }),
  total_actividades_creadas: z.number().openapi({ example: 18 }),
  detalle: z.array(
    z.object({
      patron_id: z.number().openapi({ example: 1 }),
      patron_nombre: z.string().openapi({ example: 'Culto dominical' }),
      actividades_creadas: z.number().openapi({ example: 4 }),
    }),
  ),
});

export type GenerarInstanciasResponse = z.infer<typeof GenerarInstanciasResponseSchema>;

export const PatchEstadoPatronSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    activo: z
      .boolean({ required_error: 'El campo activo es obligatorio' })
      .openapi({ example: true }),
  }),
});
