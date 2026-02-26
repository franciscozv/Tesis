import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Schema de indicadores crudos para candidato a rol de actividad (sin puntuación)
 */
export const IndicadoresRolSchema = z.object({
  disponible_en_fecha: z.boolean().openapi({ example: true }),
  conflictos_en_fecha_count: z.number().int().openapi({ example: 0 }),
  experiencia_rol_total: z.number().int().openapi({ example: 24 }),
  experiencia_rol_en_tipo: z.number().int().openapi({ example: 10 }),
  asistencia_ratio_periodo: z.number().openapi({ example: 0.95 }),
  antiguedad_anios: z.number().int().openapi({ example: 8 }),
  plena_comunion: z.boolean().openapi({ example: true }),
});

/**
 * Schema de candidato para rol de actividad (indicadores crudos, sin puntuación)
 */
export const CandidatoSchema = z.object({
  miembro_id: z.number().openapi({ example: 15 }),
  nombre_completo: z.string().openapi({ example: 'Juan Pérez López' }),
  telefono: z.string().nullable().openapi({ example: '+56912345678' }),
  email: z.string().nullable().openapi({ example: 'juan@email.com' }),
  indicadores: IndicadoresRolSchema,
  justificacion: z.string().openapi({
    example:
      'Disponible en la fecha, rol realizado 24 veces (10 en este tipo), 95% asistencia últimos 12 meses, 8 años de antigüedad, plena comunión: sí',
  }),
});

export type Candidato = z.infer<typeof CandidatoSchema>;

/**
 * Schema de indicadores crudos para candidato a cargo en grupo (sin puntuación)
 */
export const IndicadoresCargoSchema = z.object({
  experiencia_cargo_en_cuerpo: z.number().int().openapi({ example: 3 }),
  grupos_activos_count: z.number().int().openapi({ example: 2 }),
  asistencia_ratio_periodo: z.number().openapi({ example: 0.87 }),
  antiguedad_anios: z.number().int().openapi({ example: 5 }),
  plena_comunion: z.boolean().openapi({ example: true }),
});

/**
 * Schema de candidato para cargo en grupo (indicadores crudos, sin puntuación)
 */
export const CandidatoCargoSchema = z.object({
  posicion: z.number().int().openapi({ example: 1 }),
  miembro_id: z.number().openapi({ example: 15 }),
  nombre_completo: z.string().openapi({ example: 'Juan Pérez López' }),
  telefono: z.string().nullable().openapi({ example: '+56912345678' }),
  email: z.string().nullable().openapi({ example: 'juan@email.com' }),
  indicadores: IndicadoresCargoSchema,
  justificacion: z.string().openapi({
    example:
      'Ha ocupado Líder 3 veces en este cuerpo, participa en 2 grupos, 87% asistencia últimos 12 meses, 5 años de antigüedad, plena comunión: sí',
  }),
});

export type CandidatoCargo = z.infer<typeof CandidatoCargoSchema>;

/**
 * Metadata de la respuesta de sugerir-cargo
 */
export const SugerirCargoMetadataSchema = z.object({
  cuerpo_id_usado: z.number().int().openapi({ example: 1 }),
  periodo_meses_usado: z.number().int().openapi({ example: 12 }),
  cargo_id: z.number().int().openapi({ example: 3 }),
  requiere_plena_comunion: z.boolean().openapi({ example: false }),
});

/**
 * Respuesta envolvente para sugerir-cargo
 */
export const SugerirCargoResponseSchema = z.object({
  metadata: SugerirCargoMetadataSchema,
  candidatos: z.array(CandidatoCargoSchema),
});

export type SugerirCargoResponse = z.infer<typeof SugerirCargoResponseSchema>;

/**
 * Schema para sugerir candidatos para un rol en actividad
 */
export const SugerirRolSchema = z.object({
  body: z.object({
    rol_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 5 }),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .openapi({ example: '2025-03-15' }),
    tipo_actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 1 }),
    cuerpo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({
        description: 'Solo para ADMIN: filtra candidatos de un grupo específico',
        example: 2,
      }),
    periodo_meses: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Mínimo 1 mes')
      .max(60, 'Máximo 60 meses')
      .default(12)
      .openapi({ example: 12 }),
    filtro_plena_comunion: z.boolean().optional().openapi({ example: false }),
  }),
});

/**
 * Schema para sugerir candidatos para un cargo en grupo
 */
export const SugerirCargoSchema = z.object({
  body: z.object({
    cargo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 3 }),
    cuerpo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({
        description: 'Solo para ADMIN: filtra candidatos de un cuerpo específico',
        example: 1,
      }),
    periodo_meses: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Mínimo 1 mes')
      .max(60, 'Máximo 60 meses')
      .default(12)
      .openapi({ example: 12 }),
  }),
});
