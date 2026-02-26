// Base fields shared by all catalogs
interface CatalogoBase {
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// --- Roles Grupo ---
export interface RolGrupo extends CatalogoBase {
  id_rol_grupo: number;
  requiere_plena_comunion: boolean;
}

export interface CreateRolGrupoInput {
  nombre: string;
  requiere_plena_comunion?: boolean;
}

export interface UpdateRolGrupoInput {
  nombre?: string;
  requiere_plena_comunion?: boolean;
}

// --- Roles Actividad ---
export interface RolActividad extends CatalogoBase {
  id_rol: number;
  descripcion: string | null;
}

export interface CreateRolActividadInput {
  nombre: string;
  descripcion?: string;
}

export type UpdateRolActividadInput = Partial<CreateRolActividadInput>;

// --- Tipos Actividad ---
export interface TipoActividad extends CatalogoBase {
  id_tipo: number;
  descripcion: string | null;
  color: string;
}

export interface CreateTipoActividadInput {
  nombre: string;
  descripcion?: string;
  color: string;
}

export type UpdateTipoActividadInput = Partial<CreateTipoActividadInput>;

// --- Tipos Necesidad ---
export interface TipoNecesidad extends CatalogoBase {
  id_tipo: number;
  descripcion: string | null;
}

export interface CreateTipoNecesidadInput {
  nombre: string;
  descripcion?: string;
}

export type UpdateTipoNecesidadInput = Partial<CreateTipoNecesidadInput>;
