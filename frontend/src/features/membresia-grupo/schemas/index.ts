import { z } from 'zod';

export const vincularMiembroSchema = z.object({
  miembro_id: z.number().int().positive('Debe seleccionar un miembro'),
  rol_grupo_id: z.number().int().positive('Debe seleccionar un rol'),
  fecha_vinculacion: z.string().min(1, 'Fecha de vinculación es requerida'),
});

export type VincularMiembroFormData = z.infer<typeof vincularMiembroSchema>;
