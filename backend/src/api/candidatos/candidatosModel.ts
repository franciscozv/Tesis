import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Schema de detalle de un conflicto de horario
 */
export const ConflictoDetalleSchema = z.object({
  actividad: z.string().openapi({ example: 'Culto de Jóvenes' }),
  rol: z.string().openapi({ example: 'Sonido' }),
});

/**
 * Schema de indicadores crudos para candidato a responsabilidad de actividad (sin puntuación)
 */
export const IndicadoresResponsabilidadSchema = z.object({
  disponible_en_fecha: z.boolean().openapi({ example: true }),
  conflictos_en_fecha_count: z.number().int().openapi({ example: 0 }),
  conflictos_detalle: z
    .array(ConflictoDetalleSchema)
    .optional()
    .openapi({ example: [{ actividad: 'Culto de Jóvenes', rol: 'Sonido' }] }),
  experiencia_rol_total: z.number().int().openapi({ example: 24 }),
  experiencia_rol_en_tipo: z.number().int().openapi({ example: 10 }),
  dias_desde_ultimo_uso: z.number().int().nullable().openapi({
    example: 30,
    description: 'Días desde el último uso del rol. Null si nunca lo ha realizado.',
  }),
  servicios_esta_semana: z.number().int().openapi({
    example: 2,
    description: 'Servicios confirmados en la semana de la fecha objetivo.',
  }),
  asistencia_ratio_periodo: z.number().openapi({ example: 0.95 }),
  antiguedad_anios: z.number().int().openapi({ example: 8 }),
  plena_comunion: z.boolean().openapi({ example: true }),
});

/**
 * Schema de candidato para responsabilidad de actividad (indicadores crudos, sin puntuación)
 */
export const CandidatoSchema = z.object({
  miembro_id: z.number().openapi({ example: 15 }),
  nombre_completo: z.string().openapi({ example: 'Juan Pérez López' }),
  telefono: z.string().nullable().openapi({ example: '+56912345678' }),
  email: z.string().nullable().openapi({ example: 'juan@email.com' }),
  indicadores: IndicadoresResponsabilidadSchema,
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
  experiencia_cargo_en_grupo: z.number().int().openapi({ example: 3 }),
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
      'Ha ocupado Líder 3 veces en este grupo, participa en 2 grupos, 87% asistencia últimos 12 meses, 5 años de antigüedad, plena comunión: sí',
  }),
});

export type CandidatoCargo = z.infer<typeof CandidatoCargoSchema>;

/**
 * Metadata de la respuesta de sugerir-cargo
 */
export const SugerirCargoMetadataSchema = z.object({
  grupo_id_usado: z.number().int().openapi({ example: 1 }),
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
export const SugerirResponsabilidadSchema = z.object({
  body: z.object({
    responsabilidad_id: z
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
    actividad_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({
        description:
          'ID de la actividad. Si se provee, los candidatos se filtran al grupo de esa actividad (obligatorio para rol "usuario").',
        example: 10,
      }),
    grupo_id: z
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
    solo_con_experiencia: z.boolean().optional().default(false).openapi({
      description: 'Si es true, excluye candidatos sin experiencia previa en el rol',
      example: false,
    }),
    solo_sin_experiencia: z.boolean().optional().default(false).openapi({
      description:
        'Si es true, excluye candidatos con experiencia previa (rotación/nuevos talentos)',
      example: false,
    }),
    prioridad: z
      .array(z.enum(['disponibilidad', 'experiencia_tipo', 'rotacion', 'carga', 'fidelidad']))
      .optional()
      .openapi({
        description:
          'Criterios de ordenamiento. Solo los criterios presentes en este array se evalúan. Si se omite, se aplica el orden completo por defecto.',
        example: ['disponibilidad', 'rotacion'],
      }),
    incluir_con_conflictos: z.boolean().optional().default(false).openapi({
      description:
        'Si es true, incluye candidatos con conflicto de horario en los resultados (aparecen resaltados). Si es false (default), se excluyen del listado.',
      example: false,
    }),
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
    grupo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({
        description: 'Solo para ADMIN: filtra candidatos de un grupo específico',
        example: 1,
      }),
    periodo_meses: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Mínimo 1 mes')
      .max(60, 'Máximo 60 meses')
      .default(12)
      .openapi({ example: 12 }),
    solo_con_experiencia: z.boolean().optional().default(false).openapi({
      description: 'Si es true, excluye candidatos sin experiencia previa en el cargo',
      example: false,
    }),
    criterios_prioridad: z
      .array(z.enum(['experiencia', 'carga_trabajo', 'fidelidad', 'antiguedad']))
      .optional()
      .openapi({
        description:
          'Orden de prioridad para el ranking. Si está vacío se aplica el orden por defecto.',
        example: ['fidelidad', 'carga_trabajo'],
      }),
  }),
});

