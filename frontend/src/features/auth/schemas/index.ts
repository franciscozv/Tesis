import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const recuperarPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const cambiarPasswordSchema = z.object({
  password_actual: z.string().min(1, 'La contraseña actual es requerida'),
  password_nueva: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const resetPasswordSchema = z
  .object({
    nueva_password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmar_password: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.nueva_password === data.confirmar_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar_password'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RecuperarPasswordFormData = z.infer<typeof recuperarPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CambiarPasswordFormData = z.infer<typeof cambiarPasswordSchema>;
