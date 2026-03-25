import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Estados permitidos para actividades
 */
export const ESTADOS_ACTIVIDAD = ['programada', 'realizada', 'cancelada'] as const;

/**
 * Schema para Actividad
 */
export const ActividadSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  patron_id: z.number().nullable().openapi({ example: null }),
  tipo_actividad_id: z.number().openapi({ example: 1 }),
  tipo_actividad: z
    .object({
      nombre: z.string(),
      color: z.string(),
    })
    .nullable()
    .optional()
    .openapi({ example: { nombre: 'Culto Dominical', color: '#3B82F6' } }),
  nombre: z.string().openapi({ example: 'Culto dominical 12 enero' }),
  descripcion: z.string().nullable().openapi({ example: 'Servicio regular del domingo' }),
  fecha: z.string().openapi({ example: '2024-01-12' }),
  hora_inicio: z.string().openapi({ example: '10:00:00' }),
  hora_fin: z.string().openapi({ example: '11:30:00' }),
  grupo_id: z.number().nullable().openapi({ example: null }),
  lugar: z.string().openapi({ example: 'Templo principal' }),
  es_publica: z.boolean().openapi({ example: false }),
  estado: z.enum(ESTADOS_ACTIVIDAD).openapi({ example: 'programada' }),
  motivo_cancelacion: z.string().nullable().openapi({ example: null }),
  reprogramada_en_id: z.number().nullable().optional().openapi({ example: null }),
  reprogramacion_de_id: z.number().nullable().optional().openapi({ example: null }),
  creador_id: z.number().openapi({ example: 1 }),
  fecha_creacion: z.string().openapi({ example: '2024-01-10T10:00:00Z' }),
});

export type Actividad = z.infer<typeof ActividadSchema>;

/**
 * Schema para crear una Actividad
 */
export const CreateActividadSchema = z.object({
  body: z.object({
    patron_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    tipo_actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(150, 'Nombre no puede exceder 150 caracteres')
      .openapi({ example: 'Culto dominical 12 enero' }),
    descripcion: z.string().optional().openapi({ example: 'Servicio regular del domingo' }),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .openapi({ example: '2024-01-12' }),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .openapi({ example: '10:00' }),
    hora_fin: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .openapi({ example: '11:30' }),
    grupo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    lugar: z
      .string()
      .min(1, 'Lugar es obligatorio')
      .max(200, 'Lugar no puede exceder 200 caracteres')
      .openapi({ example: 'Templo principal' }),
    es_publica: z.boolean().default(false).openapi({ example: false }),
    creador_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 1 }),
  }),
});

/**
 * Schema para obtener una Actividad por ID
 */
export const GetActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar una Actividad
 */
export const UpdateActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    tipo_actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    nombre: z
      .string()
      .min(1, 'Nombre es obligatorio')
      .max(150, 'Nombre no puede exceder 150 caracteres')
      .optional()
      .openapi({ example: 'Culto dominical 12 enero' }),
    descripcion: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Servicio regular del domingo' }),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .optional()
      .openapi({ example: '2024-01-12' }),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .optional()
      .openapi({ example: '10:00' }),
    hora_fin: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .optional()
      .openapi({ example: '11:30' }),
    grupo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .nullable()
      .optional()
      .openapi({ example: 1 }),
    lugar: z
      .string()
      .min(1, 'Lugar es obligatorio')
      .max(200, 'Lugar no puede exceder 200 caracteres')
      .optional()
      .openapi({ example: 'Templo principal' }),
    es_publica: z.boolean().optional().openapi({ example: false }),
  }),
});

/**
 * Schema para cambiar el estado de una Actividad
 */
export const PatchEstadoActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z
    .object({
      estado: z
        .enum(ESTADOS_ACTIVIDAD, {
          errorMap: () => ({
            message: 'Estado debe ser: programada, realizada o cancelada',
          }),
        })
        .openapi({ example: 'cancelada' }),
      motivo_cancelacion: z
        .string()
        .min(1, 'El motivo de cancelación no puede estar vacío')
        .max(500, 'El motivo no puede exceder 500 caracteres')
        .optional()
        .openapi({ example: 'Lluvia torrencial impide el acceso al templo' }),
    })
    .refine(
      (data) => {
        if (data.estado === 'cancelada' && !data.motivo_cancelacion) return false;
        return true;
      },
      {
        message: 'El motivo de cancelación es obligatorio cuando el estado es "cancelada"',
        path: ['motivo_cancelacion'],
      },
    ),
});

/**
 * Schema para duplicar (reprogramar) una actividad cancelada
 */
export const DuplicarActividadSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .openapi({ example: '2026-04-20' }),
    hora_inicio: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .openapi({ example: '10:00' }),
    hora_fin: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)')
      .openapi({ example: '11:30' }),
  }),
});

/**
 * Schema para query params de listado de actividades (query params)
 */
export const ListActividadesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    mes: z
      .string()
      .regex(/^\d{1,2}$/, 'Mes debe ser un número entre 1 y 12')
      .transform(Number)
      .pipe(z.number().min(1).max(12))
      .optional(),
    anio: z
      .string()
      .regex(/^\d{4}$/, 'Año debe ser un número de 4 dígitos')
      .transform(Number)
      .optional(),
    estado: z.enum(ESTADOS_ACTIVIDAD).optional(),
    es_publica: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().optional(),
    grupo_id: z.coerce.number().int().positive().optional(),
  }),
});

export type GetActividadesQuery = z.infer<typeof ListActividadesQuerySchema>['query'];

export interface PaginatedActividadesResponse {
  data: Actividad[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
