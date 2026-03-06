import type { EstadoComunion } from '@/features/miembros/types';

export interface HistorialEstado {
  id: number;
  miembro_id: number;
  estado_anterior: EstadoComunion;
  estado_nuevo: EstadoComunion;
  motivo: string;
  usuario_id: number;
  fecha_cambio: string;
}

