export type TipoNotificacion =
  | 'nueva_invitacion'
  | 'nueva_colaboracion'
  | 'grupo_vinculacion'
  | 'grupo_desvinculacion'
  | 'grupo_rol_cambio'
  | 'grupo_directiva_renovacion';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
  detalle?: string;
  href: string;
  leida: boolean;
  timestamp: Date;
}
