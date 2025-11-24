import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Enum de roles de usuario
 */
export const RolUsuarioEnum = z.enum(['admin', 'pastor', 'secretario', 'lider', 'miembro']);
export type RolUsuario = z.infer<typeof RolUsuarioEnum>;

/**
 * Schema principal de Usuario
 */
export const UsuarioSchema = z.object({
  id_usuario: z.number(),
  miembro_id: z.number(),
  email: z.string(),
  password_hash: z.string(),
  rol: RolUsuarioEnum,
  activo: z.boolean(),
  ultimo_acceso: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Usuario = z.infer<typeof UsuarioSchema>;

/**
 * Schema de Usuario sin password_hash (para respuestas)
 */
export const UsuarioPublicoSchema = z.object({
  id_usuario: z.number(),
  miembro_id: z.number(),
  email: z.string(),
  rol: RolUsuarioEnum,
  activo: z.boolean(),
  ultimo_acceso: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UsuarioPublico = z.infer<typeof UsuarioPublicoSchema>;

/**
 * Schema de Usuario con info del miembro
 */
export const UsuarioConMiembroSchema = UsuarioPublicoSchema.extend({
  miembro: z.object({
    id: z.number(),
    nombre: z.string(),
    apellido: z.string(),
    rut: z.string().nullable(),
    telefono: z.string().nullable(),
  }),
});

export type UsuarioConMiembro = z.infer<typeof UsuarioConMiembroSchema>;

/**
 * Schema para registrar un nuevo usuario
 */
export const RegisterSchema = z.object({
  body: z.object({
    miembro_id: z.number().int().positive(),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    rol: RolUsuarioEnum,
  }),
});

/**
 * Schema para login
 */
export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  }),
});

/**
 * Schema para cambiar contraseña
 */
export const CambiarPasswordSchema = z.object({
  body: z.object({
    password_actual: z.string().min(1, 'La contraseña actual es obligatoria'),
    password_nueva: z.string().min(8, 'La contraseña nueva debe tener al menos 8 caracteres'),
  }),
});

/**
 * Schema de respuesta de login
 */
export const LoginResponseSchema = z.object({
  token: z.string(),
  usuario: UsuarioPublicoSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Schema del payload del JWT
 */
export interface JWTPayload {
  id_usuario: number;
  miembro_id: number;
  email: string;
  rol: RolUsuario;
}
