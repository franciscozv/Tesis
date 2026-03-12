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
  /** Servicios confirmados en la semana de la fecha objetivo. */
  servicios_esta_semana: number;
  asistencia_ratio_periodo: number;
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
  periodo_meses?: number;
  filtro_plena_comunion?: boolean;
  /** Solo para administradores: filtra candidatos de un grupo específico */
  grupo_id?: number;
  /** Excluir candidatos sin experiencia previa en el rol */
  solo_con_experiencia?: boolean;
  /** Excluir candidatos con experiencia previa (rotación / nuevos talentos) */
  solo_sin_experiencia?: boolean;
  /** Orden de prioridad para el ranking: disponibilidad | experiencia_tipo | rotacion | carga | fidelidad */
  prioridad?: string[];
  /** Si true, incluye candidatos con conflicto de horario en los resultados (resaltados en rojo). Default: false (excluir). */
  incluir_con_conflictos?: boolean;
}

// ─── Sugerir Cargo (indicadores crudos, sin scoring) ─────────────────────────

export interface IndicadoresCargo {
  experiencia_cargo_en_grupo: number;
  grupos_activos_count: number;
  asistencia_ratio_periodo: number;
  antiguedad_anios: number;
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
  criterios_prioridad?: string[];
}
