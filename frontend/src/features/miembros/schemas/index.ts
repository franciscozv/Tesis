import { z } from 'zod';

export const createMiembroSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  rut: z
    .string()
    .regex(/^\d{7,8}-[\dkK]$/, 'Formato RUT inválido')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  bautizado: z.boolean().default(false),
});

export const updateMiembroSchema = createMiembroSchema.partial();

export type CreateMiembroFormData = z.infer<typeof createMiembroSchema>;
export type UpdateMiembroFormData = z.infer<typeof updateMiembroSchema>;