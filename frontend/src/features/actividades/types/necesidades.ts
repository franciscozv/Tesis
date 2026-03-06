export type EstadoNecesidad = 'abierta' | 'cubierta' | 'cerrada';

export interface NecesidadLogistica {
  id: number;
  actividad_id: number;
  tipo_necesidad_id: number;
  descripcion: string;
  cantidad_requerida: number;
  unidad_medida: string;
  cantidad_cubierta: number;
  estado: EstadoNecesidad;
  fecha_registro: string;
}

export interface CreateNecesidadInput {
  actividad_id: number;
  tipo_necesidad_id: number;
  descripcion: string;
  cantidad_requerida: number;
  unidad_medida: string;
  cantidad_cubierta?: number;
}

