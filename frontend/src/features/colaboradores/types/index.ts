export interface Colaborador {
  id: number;
  necesidad_id: number;
  miembro_id: number;
  cantidad_comprometida: number;
  observaciones: string | null;
  cumplio: boolean;
  fecha_compromiso: string;
  miembro?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  necesidad?: {
    id: number;
    descripcion: string;
    actividad_id: number;
    actividad?: {
      id: number;
      nombre: string;
      fecha: string;
      hora_fin: string;
      estado: string;
    };
  };
}

export interface ColaboradorFilters {
  necesidad_id?: number;
  miembro_id?: number;
  estado?: string;
}

export interface CreateColaboradorInput {
  necesidad_id: number;
  miembro_id: number;
  cantidad_comprometida: number;
  observaciones?: string;
}

export interface MarcarCumplioInput {
  cumplio: boolean;
}
