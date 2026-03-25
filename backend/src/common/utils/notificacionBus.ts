import { EventEmitter } from 'node:events';

export interface NotificacionEvent {
  id?: number;
  tipo:
    | 'nueva_invitacion'
    | 'nueva_colaboracion'
    | 'actividad_cancelada'
    | 'actividad_reprogramada'
    | 'invitacion_confirmada'
    | 'invitacion_rechazada'
    | 'grupo_vinculacion'
    | 'grupo_desvinculacion'
    | 'grupo_rol_cambio'
    | 'grupo_directiva_renovacion';
  mensaje: string;
  href: string;
  timestamp: number;
  detalle?: string;
  /** true cuando el evento se envía como flush al reconectar (no mostrar toast) */
  flush?: boolean;
}

/**
 * Bus de eventos en memoria para notificaciones en tiempo real (SSE).
 * Canales:
 *   - 'user:{miembroId}' — notificaciones personales (invitaciones)
 *   - 'admin'            — notificaciones globales (ofertas de colaboración)
 */
export const notificacionBus = new EventEmitter();
notificacionBus.setMaxListeners(200);
