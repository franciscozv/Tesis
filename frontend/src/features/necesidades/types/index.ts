export type EstadoNecesidad = 'abierta' | 'cubierta' | 'cerrada' | 'cancelada';

export interface NecesidadMaterial {
  id: number;
  actividad_id: number;
  tipo_necesidad_id: number;
  descripcion: string;
  cantidad_requerida: number;
  unidad_medida: string;
  cantidad_cubierta: number;
  estado: EstadoNecesidad;
  fecha_registro: string;
  actividad?: {
    id: number;
    nombre: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    lugar: string;
    estado?: string;
  };
  tipo_necesidad?: {
    id_tipo: number;
    nombre: string;
  };
}

// Alias para compatibilidad con código existente
export type NecesidadLogistica = NecesidadMaterial;

export interface NecesidadFilters {
  actividad_id?: number;
  estado?: EstadoNecesidad;
}

export interface CreateNecesidadInput {
  actividad_id: number;
  tipo_necesidad_id: number;
  descripcion: string;
  cantidad_requerida: number;
  unidad_medida: string;
  cantidad_cubierta?: number;
}

export interface UpdateNecesidadInput {
  tipo_necesidad_id?: number;
  descripcion?: string;
  cantidad_requerida?: number;
  unidad_medida?: string;
  cantidad_cubierta?: number;
}

export interface CambiarEstadoNecesidadInput {
  estado: EstadoNecesidad;
}
