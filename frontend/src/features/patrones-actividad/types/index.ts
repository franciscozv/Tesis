export type Frecuencia =
  | 'semanal'
  | 'primera_semana'
  | 'segunda_semana'
  | 'tercera_semana'
  | 'cuarta_semana';

export interface PatronActividad {
  id: number;
  nombre: string;
  tipo_actividad_id: number;
  frecuencia: Frecuencia;
  dia_semana: number;
  hora_inicio: string;
  duracion_minutos: number;
  lugar: string;
  grupo_id: number | null;
  es_publica: boolean;
  activo: boolean;
  fecha_creacion: string;
}

export interface CreatePatronInput {
  nombre: string;
  tipo_actividad_id: number;
  frecuencia: Frecuencia;
  dia_semana: number;
  hora_inicio: string;
  duracion_minutos: number;
  lugar: string;
  grupo_id?: number;
  es_publica: boolean;
}

export type UpdatePatronInput = Partial<CreatePatronInput>;

export interface GenerarInstanciasInput {
  mes: number;
  anio: number;
}

export interface GenerarInstanciasResult {
  total_patrones: number;
  total_actividades_creadas: number;
  detalle: {
    patron_id: number;
    patron_nombre: string;
    actividades_creadas: number;
  }[];
}
