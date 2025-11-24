
export interface Miembro {
  id: number;
  nombre: string;
  apellido: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  bautizado: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMiembroInput {
  nombre: string;
  apellido: string;
  rut?: string;
  email?: string;
  telefono?: string;
  bautizado: boolean;
}

export interface UpdateMiembroInput extends Partial<CreateMiembroInput> {}