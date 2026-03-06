export type EstadoInvitado = 'pendiente' | 'confirmado' | 'rechazado';

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

export interface CreateInvitadoInput {
  actividad_id: number;
  miembro_id: number;
  responsabilidad_id: number;
  confirmado?: boolean;
}

