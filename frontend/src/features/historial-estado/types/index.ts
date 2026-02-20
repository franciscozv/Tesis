import type { EstadoMembresia } from '@/features/miembros/types';

export interface HistorialEstado {
  id: number;
  miembro_id: number;
  estado_anterior: EstadoMembresia;
  estado_nuevo: EstadoMembresia;
  motivo: string;
  usuario_id: number;
  fecha_cambio: string;
}
