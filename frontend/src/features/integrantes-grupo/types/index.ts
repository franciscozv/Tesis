export type { RolGrupo } from '@/features/catalogos/types';

export interface VincularMiembroInput {
  miembro_id: number;
  grupo_id: number;
  rol_grupo_id: number;
  fecha_vinculacion?: string;
}

export interface DesvincularMiembroInput {
  fecha_desvinculacion?: string;
}

export interface CambiarRolInput {
  rol_grupo_id: number;
}

