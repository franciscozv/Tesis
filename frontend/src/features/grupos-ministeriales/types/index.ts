export interface GrupoMinisterial {
  id_grupo: number;
  encargado_actual: { miembro_id: number; nombre: string; apellido: string } | null;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
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

export interface AsignarEncargadoInput {
  nuevo_miembro_id: number;
  fecha?: string;
}

export interface MiembroGrupo {
  id: number;
  miembro_id: number;
  grupo: { id: number; nombre: string };
  rol: { id: number; nombre: string };
  fecha_vinculacion: string;
  fecha_desvinculacion: string | null;
  miembro?: {
    id: number;
    nombre: string;
    apellido: string;
    rut: string;
  };
}
