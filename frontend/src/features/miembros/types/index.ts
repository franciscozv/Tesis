export type EstadoMembresia = 'sin_membresia' | 'probando' | 'plena_comunion';
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
  bautizado: boolean;
  estado_membresia: EstadoMembresia;
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
  bautizado: boolean;
  estado_membresia: EstadoMembresia;
  fecha_ingreso: string;
}

export interface UpdateMiembroInput extends Partial<Omit<CreateMiembroInput, 'estado_membresia'>> {}

export interface UpdateMiPerfilInput {
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface CambiarEstadoInput {
  estado_nuevo: EstadoMembresia;
  motivo: string;
}
