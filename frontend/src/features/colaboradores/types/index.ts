export type EstadoColaborador = 'pendiente' | 'aceptada' | 'rechazada';

export interface Colaborador {
  id: number;
  necesidad_id: number;
  miembro_id: number;
  cantidad_ofrecida: number;
  observaciones: string | null;
  estado: EstadoColaborador;
  fecha_oferta: string;
  fecha_decision: string | null;
  miembro?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  necesidad?: {
    id: number;
    descripcion: string;
    actividad_id: number;
  };
}

export interface ColaboradorFilters {
  necesidad_id?: number;
  miembro_id?: number;
  estado?: EstadoColaborador;
}

export interface CreateColaboradorInput {
  necesidad_id: number;
  miembro_id: number;
  cantidad_ofrecida: number;
  observaciones?: string;
}

export interface DecidirOfertaInput {
  estado: 'aceptada' | 'rechazada';
}
