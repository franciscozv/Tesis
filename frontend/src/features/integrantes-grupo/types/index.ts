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

export interface RenovarDirectivaItem {
  cargo_id: number;
  nuevo_miembro_id: number;
}

export interface RenovarDirectivaInput {
  renovaciones: RenovarDirectivaItem[];
  fecha?: string;
}

export interface HistorialDirectivaEntry {
  id: number;
  miembro_id: number;
  miembro?: { id: number; nombre: string; apellido: string; rut: string };
  grupo: { id: number; nombre: string };
  rol: { id: number; nombre: string; es_directiva: boolean };
  fecha_vinculacion: string;
  fecha_desvinculacion: string | null;
}
