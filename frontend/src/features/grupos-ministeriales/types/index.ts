import type { EstadoComunion } from '@/features/miembros/types';

export interface GrupoMinisterial {
  id_grupo: number;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface GrupoConPermisos extends GrupoMinisterial {
  es_directiva_miembro: boolean;
}

export interface CreateGrupoInput {
  nombre: string;
  descripcion?: string | null;
  fecha_creacion: string;
}

export interface UpdateGrupoInput {
  nombre?: string;
  descripcion?: string | null;
}

export interface MiembroGrupo {
  id: number;
  miembro_id: number;
  grupo: { id: number; nombre: string };
  rol: { id: number; nombre: string; es_directiva: boolean };
  fecha_vinculacion: string;
  fecha_desvinculacion: string | null;
  miembro?: {
    id: number;
    nombre: string;
    apellido: string;
    rut: string;
    estado_comunion?: EstadoComunion;
  };
}
