export type EstadoComunion = 'asistente' | 'probando' | 'plena_comunion';
export type Genero = 'masculino' | 'femenino';

export interface Miembro {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  direccion: string | null;
  genero: Genero | null;
  estado_comunion: EstadoComunion;
  fecha_ingreso: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMiembroInput {
  rut: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  genero?: Genero | null;
  estado_comunion: EstadoComunion;
  fecha_ingreso: string;
}

export interface UpdateMiembroInput extends Partial<Omit<CreateMiembroInput, 'estado_comunion'>> {}

export interface UpdateMiPerfilInput {
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface CambiarEstadoInput {
  estado_nuevo: EstadoComunion;
  motivo: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedMiembrosResponse {
  data: Miembro[];
  meta: PaginationMeta;
}

export interface MiembrosQueryParams {
  page: number;
  limit: number;
  search?: string;
  estado_comunion?: EstadoComunion | '';
}

