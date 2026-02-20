import { z } from 'zod';

export const ofrecerColaboracionSchema = z.object({
  cantidad_ofrecida: z.coerce.number().positive('Debe ser mayor a 0'),
  observaciones: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

export type OfrecerColaboracionFormData = z.infer<typeof ofrecerColaboracionSchema>;
