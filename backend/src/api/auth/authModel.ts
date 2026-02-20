import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

/**
 * Schema para la respuesta de login (token + datos del usuario)
 */
export const LoginResponseSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  usuario: z.object({
    id: z.number().openapi({ example: 1 }),
    email: z.string().email().openapi({ example: 'admin@iglesia.cl' }),
    rol: z.enum(['administrador', 'lider', 'miembro']).openapi({ example: 'administrador' }),
    miembro_id: z.number().nullable().openapi({ example: 5 }),
  }),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Schema para login
 */
export const LoginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .openapi({ example: 'admin@iglesia.cl' }),
    password: z
      .string()
      .min(1, 'La contraseña es obligatoria')
      .openapi({ example: 'Password123' }),
  }),
});

/**
 * Schema para cambiar contraseña (requiere token)
 */
export const CambiarPasswordSchema = z.object({
  body: z.object({
    password_actual: z
      .string()
      .min(1, 'La contraseña actual es obligatoria')
      .openapi({ example: 'Password123' }),
    password_nueva: z
      .string()
      .min(8, 'La nueva contraseña debe tener mínimo 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .openapi({ example: 'NuevaPassword456' }),
  }),
});

/**
 * Schema para recuperar contraseña
 */
export const RecuperarPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .openapi({ example: 'admin@iglesia.cl' }),
  }),
});

/**
 * Schema para reset de contraseña con token
 */
export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'El token es obligatorio')
      .openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    nueva_password: z
      .string()
      .min(8, 'La nueva contraseña debe tener mínimo 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres')
      .openapi({ example: 'NuevaPassword456' }),
  }),
});

/**
 * Schema para respuesta genérica de mensaje
 */
export const MensajeResponseSchema = z.object({
  mensaje: z.string().openapi({ example: 'Operación exitosa' }),
});
