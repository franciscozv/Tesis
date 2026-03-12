export type RolUsuario = 'administrador' | 'usuario';

export interface Usuario {
  id: number;
  miembro_id: number | null;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string | null;
}

export interface CreateUsuarioInput {
  email: string;
  password: string;
  rol: RolUsuario;
  miembro_id?: number;
}

export interface UpdateUsuarioInput {
  email?: string;
  rol?: RolUsuario;
}

export interface PatchEstadoUsuarioInput {
  activo: boolean;
}
