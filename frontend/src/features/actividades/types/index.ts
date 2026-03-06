export type EstadoActividad = 'programada' | 'realizada' | 'cancelada';

export interface Actividad {
  id: number;
  patron_id: number | null;
  tipo_actividad_id: number;
  tipo_actividad?: { nombre: string; color: string } | null;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  grupo_id: number | null;
  es_publica: boolean;
  estado: EstadoActividad;
  motivo_cancelacion: string | null;
  creador_id: number;
  fecha_creacion: string;
}

export interface CreateActividadInput {
  patron_id?: number | null;
  tipo_actividad_id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  grupo_id?: number | null;
  es_publica: boolean;
  creador_id: number;
}

export type UpdateActividadInput = Partial<Omit<CreateActividadInput, 'creador_id'>>;

export interface CambiarEstadoActividadInput {
  estado: EstadoActividad;
  motivo_cancelacion?: string;
}

export interface ActividadFilters {
  mes?: number;
  anio?: number;
  estado?: EstadoActividad;
  es_publica?: boolean;
}

