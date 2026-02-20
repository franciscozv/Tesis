export interface DesgloseScoring {
  experiencia: number;
  antiguedad: number;
  asistencia: number;
  disponibilidad: number;
}

export interface Candidato {
  miembro_id: number;
  nombre_completo: string;
  puntuacion_total: number;
  desglose: DesgloseScoring;
  justificacion: string;
  telefono: string | null;
  email: string | null;
}

export interface SugerirRolInput {
  rol_id: number;
  fecha: string;
}

export interface SugerirCargoInput {
  cargo_id: number;
}
