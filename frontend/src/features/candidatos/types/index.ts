// ─── Sugerir Rol (indicadores crudos, sin scoring) ────────────────────────────

export interface ConflictoDetalle {
  actividad: string;
  rol: string;
}

export interface IndicadoresRol {
  disponible_en_fecha: boolean;
  conflictos_en_fecha_count: number;
  /** Detalle de cada actividad que causa el conflicto de horario. */
  conflictos_detalle?: ConflictoDetalle[];
  experiencia_rol_total: number;
  experiencia_rol_en_tipo: number;
  /** Días desde el último uso del rol. null = nunca lo ha realizado. */
  dias_desde_ultimo_uso: number | null;
  /** Nombre de la actividad en la que realizó el rol por última vez. null = nunca lo ha realizado. */
  ultimo_uso_nombre?: string | null;
  /** Tipo de actividad del último uso del rol. null = nunca lo ha realizado o sin tipo asignado. */
  ultimo_uso_tipo_actividad?: string | null;
  /** Servicios confirmados en la semana de la fecha objetivo. */
  servicios_este_mes: number;
  /** Detalle de los servicios confirmados este mes (actividad, rol y fecha). */
  servicios_este_mes_detalle?: Array<{ actividad: string; rol: string; fecha: string }>;
  asistencia_ratio_periodo: number;
  asistencias_count: number;
  confirmadas_count: number;
  resumen_servicios: Array<{ tipo: string; rol: string; cantidad: number }>;
  antiguedad_anios: number;
  plena_comunion: boolean;
}

export interface Candidato {
  miembro_id: number;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  indicadores: IndicadoresRol;
  justificacion: string;
}

export interface SugerirRolInput {
  responsabilidad_id: number;
  fecha: string;
  tipo_actividad_id?: number;
  /** ID de la actividad. Para rol 'usuario', restringe los candidatos al grupo de esa actividad. */
  actividad_id?: number;
  filtro_plena_comunion?: boolean;
  /** Solo para administradores: filtra candidatos de un grupo específico */
  grupo_id?: number;
  /** Si true, incluye candidatos con conflicto de horario en los resultados (resaltados en rojo). Default: false (excluir). */
  incluir_con_conflictos?: boolean;
  /** Si true, entre candidatos con igual rotación y carga, se priorizan quienes tienen experiencia en este tipo de actividad. */
  priorizar_experiencia_tipo?: boolean;
}

// ─── Sugerir Cargo (indicadores crudos, sin scoring) ─────────────────────────

export interface ExperienciaCargoHistorial {
  cargo_nombre?: string;
  grupo_nombre: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_directiva?: boolean;
}

export interface IndicadoresCargo {
  experiencia_cargo_en_grupo: number;
  historial_experiencia: ExperienciaCargoHistorial[];
  historial_otros_cargos: ExperienciaCargoHistorial[];
  grupos_activos_count: number;
  grupos_activos_detalle: Array<{ grupo: string; rol: string }>;
  asistencia_ratio_periodo: number;
  asistencias_count: number;
  confirmadas_count: number;
  resumen_servicios: Array<{ tipo: string; rol: string; cantidad: number }>;
  antiguedad_anios: number;
  antiguedad_grupo_anios?: number;
  fecha_ingreso: string;
  fecha_vinculacion_grupo?: string;
  plena_comunion: boolean;
}

export interface CandidatoCargo {
  posicion: number;
  miembro_id: number;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  indicadores: IndicadoresCargo;
  justificacion: string;
}

export interface SugerirCargoMetadata {
  grupo_id_usado: number;
  periodo_meses_usado: number;
  cargo_id: number;
  requiere_plena_comunion: boolean;
}

export interface SugerirCargoResponse {
  metadata: SugerirCargoMetadata;
  candidatos: CandidatoCargo[];
}

export interface SugerirCargoInput {
  cargo_id: number;
  grupo_id?: number;
  periodo_meses?: number;
  solo_con_experiencia?: boolean;
  solo_con_plena_comunion?: boolean;
  criterios_prioridad?: string[];
}
