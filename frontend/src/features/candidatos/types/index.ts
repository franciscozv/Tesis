// ─── Sugerir Rol (indicadores crudos, sin scoring) ────────────────────────────

export interface IndicadoresRol {
  disponible_en_fecha: boolean;
  conflictos_en_fecha_count: number;
  experiencia_rol_total: number;
  experiencia_rol_en_tipo: number;
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
  rol_id: number;
  fecha: string;
  tipo_actividad_id?: number;
  periodo_meses?: number;
  filtro_plena_comunion?: boolean;
  /** Solo para administradores: filtra candidatos de un grupo específico */
  cuerpo_id?: number;
}

// ─── Sugerir Cargo (indicadores crudos, sin scoring) ─────────────────────────

export interface IndicadoresCargo {
  experiencia_cargo_en_cuerpo: number;
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
  cuerpo_id_usado: number;
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
  /** Solo para ADMIN cuando no tiene cuerpo_id en token */
  cuerpo_id?: number;
  periodo_meses?: number;
}
