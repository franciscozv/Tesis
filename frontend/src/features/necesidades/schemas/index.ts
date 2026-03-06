import { z } from 'zod';

export const createNecesidadSchema = z.object({
  actividad_id: z.coerce.number().int().positive('Seleccione una actividad'),
  tipo_necesidad_id: z.coerce.number().int().positive('Seleccione un tipo'),
  descripcion: z.string().min(1, 'La descripción es requerida').max(1000, 'Máximo 1000 caracteres'),
  cantidad_requerida: z.coerce.number().positive('Debe ser mayor a 0'),
  unidad_medida: z.string().min(1, 'La unidad es requerida').max(50, 'Máximo 50 caracteres'),
});

export type CreateNecesidadFormData = z.infer<typeof createNecesidadSchema>;

export const updateNecesidadSchema = z.object({
  tipo_necesidad_id: z.coerce.number().int().positive('Seleccione un tipo'),
  descripcion: z.string().min(1, 'La descripción es requerida').max(1000, 'Máximo 1000 caracteres'),
  cantidad_requerida: z.coerce.number().positive('Debe ser mayor a 0'),
  unidad_medida: z.string().min(1, 'La unidad es requerida').max(50, 'Máximo 50 caracteres'),
});

export type UpdateNecesidadFormData = z.infer<typeof updateNecesidadSchema>;

