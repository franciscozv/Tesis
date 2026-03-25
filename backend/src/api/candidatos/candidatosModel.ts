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
 * Schema de detalle de un servicio confirmado este mes
 */
export const ServicioSemanaDetalleSchema = z.object({
  actividad: z.string().openapi({ example: 'Culto Dominical' }),
  rol: z.string().openapi({ example: 'Músico' }),
  fecha: z.string().openapi({ example: '2025-03-16' }),
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
  ultimo_uso_nombre: z.string().nullable().optional().openapi({
    example: 'Culto Dominical',
    description:
      'Nombre de la actividad en la que realizó el rol por última vez. Null si nunca lo ha realizado.',
  }),
  ultimo_uso_tipo_actividad: z.string().nullable().optional().openapi({
    example: 'Culto',
    description:
      'Tipo de la actividad en la que realizó el rol por última vez. Null si nunca lo ha realizado o si no tiene tipo.',
  }),
  servicios_este_mes: z.number().int().openapi({
    example: 2,
    description: 'Servicios confirmados en la semana de la fecha objetivo.',
  }),
  servicios_este_mes_detalle: z
    .array(ServicioSemanaDetalleSchema)
    .optional()
    .openapi({
      description: 'Detalle de los servicios confirmados este mes (actividad, rol y fecha).',
      example: [{ actividad: 'Culto Dominical', rol: 'Músico', fecha: '2025-03-16' }],
    }),
  antiguedad_anios: z.number().openapi({ example: 5 }),
  resumen_servicios: z
    .array(
      z.object({
        tipo: z.string().openapi({ example: 'Culto' }),
        rol: z.string().openapi({ example: 'Predicador' }),
        cantidad: z.number().int().openapi({ example: 10 }),
      }),
    )
    .optional()
    .openapi({ description: 'Resumen de actividades asistidas por tipo y rol.' }),
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
 * Schema de historial de experiencia en cargo
 */
export const ExperienciaCargoHistorialSchema = z.object({
  cargo_nombre: z.string().optional().openapi({ example: 'Secretario' }),
  grupo_nombre: z.string().openapi({ example: 'Coro Instrumental' }),
  fecha_inicio: z.string().openapi({ example: '2023-01-15' }),
  fecha_fin: z.string().nullable().openapi({ example: '2024-01-15' }),
  es_directiva: z.boolean().optional(),
});

export type ExperienciaCargoHistorial = z.infer<typeof ExperienciaCargoHistorialSchema>;

/**
 * Schema de indicadores crudos para candidato a cargo en grupo (sin puntuación)
 */
export const IndicadoresCargoSchema = z.object({
  experiencia_cargo_en_grupo: z.number().int().openapi({ example: 3 }),
  historial_experiencia: z.array(ExperienciaCargoHistorialSchema).openapi({
    example: [
      { grupo_nombre: 'Coro', fecha_inicio: '2022-01-01', fecha_fin: '2022-12-31' },
      { grupo_nombre: 'Jóvenes', fecha_inicio: '2023-01-01', fecha_fin: null },
    ],
  }),
  historial_otros_cargos: z.array(ExperienciaCargoHistorialSchema).openapi({
    example: [
      {
        cargo_nombre: 'Secretario',
        grupo_nombre: 'Damas',
        fecha_inicio: '2021-01-01',
        fecha_fin: '2021-12-31',
      },
    ],
  }),
  grupos_activos_count: z.number().int().openapi({ example: 2 }),
  grupos_activos_detalle: z
    .array(
      z.object({
        grupo: z.string().openapi({ example: 'Coro Instrumental' }),
        rol: z.string().openapi({ example: 'Director' }),
      }),
    )
    .openapi({
      description: 'Detalle de los grupos y roles donde el miembro participa actualmente.',
    }),
  asistencia_ratio_periodo: z.number().openapi({ example: 0.87 }),
  asistencias_count: z.number().int().openapi({ example: 10 }),
  confirmadas_count: z.number().int().openapi({ example: 12 }),
  resumen_servicios: z
    .array(
      z.object({
        tipo: z.string().openapi({ example: 'Culto' }),
        rol: z.string().openapi({ example: 'Predicador' }),
        cantidad: z.number().int().openapi({ example: 10 }),
      }),
    )
    .optional()
    .default([])
    .openapi({ description: 'Resumen de actividades asistidas por tipo y rol.' }),
  antiguedad_anios: z.number().int().default(0).openapi({ example: 8 }),
  antiguedad_grupo_anios: z.number().int().default(0).openapi({ example: 3 }),
  fecha_ingreso: z.string().openapi({ example: '2015-01-01' }),
  fecha_vinculacion_grupo: z.string().optional().nullable().openapi({ example: '2021-01-01' }),
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
  grupo_id_usado: z.number().int().optional().openapi({ example: 1 }),
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
    filtro_plena_comunion: z.boolean().optional().openapi({ example: false }),
    incluir_con_conflictos: z.boolean().optional().default(false).openapi({
      description:
        'Si es true, incluye candidatos con conflicto de horario en los resultados (aparecen resaltados). Si es false (default), se excluyen del listado.',
      example: false,
    }),
    priorizar_experiencia_tipo: z.boolean().optional().default(false).openapi({
      description:
        'Si es true, entre candidatos con igual rotación y carga, se priorizan quienes tienen experiencia en este tipo de actividad.',
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
    solo_con_plena_comunion: z.boolean().optional().default(false).openapi({
      description: 'Si es true, excluye candidatos que no tengan plena comunión',
      example: false,
    }),
    criterios_prioridad: z
      .array(z.enum(['experiencia', 'carga_trabajo', 'fidelidad', 'colaboracion', 'antiguedad']))
      .optional()
      .openapi({
        description:
          'Orden de prioridad para el ranking. Si está vacío se aplica el orden por defecto.',
        example: ['fidelidad', 'carga_trabajo'],
      }),
  }),
});
