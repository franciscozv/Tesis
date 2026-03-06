import { z } from 'zod';

export const EstadoComunionEnum = z.enum(['asistente', 'probando', 'plena_comunion']);
export const generoEnum = z.enum(['masculino', 'femenino']);

export const createMiembroSchema = z.object({
  rut: z
    .string()
    .min(9, 'RUT muy corto')
    .max(10, 'RUT muy largo')
    .regex(/^\d{7,8}-[\dkK]$/, 'Formato RUT inválido (ej: 12345678-9)'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(150).or(z.literal('')).optional(),
  telefono: z.string().max(20).or(z.literal('')).optional(),
  fecha_nacimiento: z
    .string()
    .or(z.literal(''))
    .optional()
    .refine((date) => {
      if (!date) return true;
      const [year, month, day] = date.split('-').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate <= today;
    }, 'La fecha de nacimiento no puede ser futura'),
  direccion: z.string().or(z.literal('')).optional(),
  genero: generoEnum.or(z.literal('')).optional(),
  estado_comunion: EstadoComunionEnum,
  fecha_ingreso: z
    .string()
    .min(1, 'Fecha de ingreso es requerida')
    .refine((date) => {
      if (!date) return false;
      const [year, month, day] = date.split('-').map(Number);
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate <= today;
    }, 'La fecha de ingreso no puede ser futura'),
});

export const updateMiembroSchema = createMiembroSchema
  .partial()
  .omit({ rut: true, estado_comunion: true });

export const cambiarEstadoSchema = z.object({
  estado_nuevo: EstadoComunionEnum,
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
});

export const miPerfilSchema = z.object({
  direccion: z.string().or(z.literal('')).optional(),
  telefono: z
    .string()
    .regex(/^\+56\s?9\s?\d{4}\s?\d{4}$/, 'Formato: +56 9 XXXX XXXX')
    .or(z.literal(''))
    .optional(),
  email: z.string().email('Email inválido').max(150).or(z.literal('')).optional(),
});

export type MiPerfilFormData = z.infer<typeof miPerfilSchema>;

export type CreateMiembroFormData = z.infer<typeof createMiembroSchema>;
export type UpdateMiembroFormData = z.infer<typeof updateMiembroSchema>;
export type CambiarEstadoFormData = z.infer<typeof cambiarEstadoSchema>;

