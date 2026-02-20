import { z } from 'zod';

export const createGrupoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  lider_principal_id: z.number().int().positive('Debe seleccionar un líder'),
  descripcion: z.string().or(z.literal('')).optional(),
  fecha_creacion: z.string().min(1, 'Fecha de creación es requerida'),
});

export const updateGrupoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100).optional(),
  lider_principal_id: z.number().int().positive('Debe seleccionar un líder').optional(),
  descripcion: z.string().or(z.literal('')).optional(),
});

export type CreateGrupoFormData = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoFormData = z.infer<typeof updateGrupoSchema>;
