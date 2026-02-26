import { z } from 'zod';

// --- Roles Grupo ---
export const createRolGrupoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres').trim(),
  requiere_plena_comunion: z.boolean().default(true),
});

export const updateRolGrupoSchema = createRolGrupoSchema.partial();

export type CreateRolGrupoFormData = z.infer<typeof createRolGrupoSchema>;
export type UpdateRolGrupoFormData = z.infer<typeof updateRolGrupoSchema>;

// --- Roles Actividad ---
export const createRolActividadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().or(z.literal('')).optional(),
});

export const updateRolActividadSchema = createRolActividadSchema.partial();

export type CreateRolActividadFormData = z.infer<typeof createRolActividadSchema>;
export type UpdateRolActividadFormData = z.infer<typeof updateRolActividadSchema>;

// --- Tipos Actividad ---
export const createTipoActividadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().or(z.literal('')).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color inválido (ej: #3B82F6)'),
});

export const updateTipoActividadSchema = createTipoActividadSchema.partial();

export type CreateTipoActividadFormData = z.infer<typeof createTipoActividadSchema>;
export type UpdateTipoActividadFormData = z.infer<typeof updateTipoActividadSchema>;

// --- Tipos Necesidad ---
export const createTipoNecesidadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().or(z.literal('')).optional(),
});

export const updateTipoNecesidadSchema = createTipoNecesidadSchema.partial();

export type CreateTipoNecesidadFormData = z.infer<typeof createTipoNecesidadSchema>;
export type UpdateTipoNecesidadFormData = z.infer<typeof updateTipoNecesidadSchema>;
