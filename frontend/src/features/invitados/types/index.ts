export type EstadoInvitado = 'pendiente' | 'confirmado' | 'rechazado' | 'cancelado';

export interface Invitado {
  id: number;
  actividad_id: number;
  miembro_id: number;
  responsabilidad_id: number;
  estado: EstadoInvitado;
  motivo_rechazo: string | null;
  asistio: boolean;
  fecha_invitacion: string;
  fecha_respuesta: string | null;
  actividad?: {
    id: number;
    nombre: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  };
  miembro?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  rol?: {
    id_responsabilidad: number;
    nombre: string;
  };
}

export interface InvitadoFilters {
  actividad_id?: number;
  miembro_id?: number;
  estado?: EstadoInvitado;
}

export interface CreateInvitadoInput {
  actividad_id: number;
  miembro_id: number;
  responsabilidad_id: number;
}

export interface ResponderInvitacionInput {
  estado: 'confirmado' | 'rechazado';
  motivo_rechazo?: string;
}
