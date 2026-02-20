import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Roles permitidos para usuarios
 */
export const ROLES_USUARIO = ['administrador', 'lider', 'miembro'] as const;

/**
 * Schema para Usuario (respuesta, sin password_hash)
 */
export const UsuarioSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  miembro_id: z.number().nullable().openapi({ example: 5 }),
  email: z.string().email().openapi({ example: 'admin@iglesia.cl' }),
  rol: z.enum(ROLES_USUARIO).openapi({ example: 'administrador' }),
  activo: z.boolean().openapi({ example: true }),
  fecha_creacion: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
  ultimo_acceso: z.string().nullable().openapi({ example: null }),
});

export type Usuario = z.infer<typeof UsuarioSchema>;

/**
 * Schema interno que incluye password_hash (para uso en repository)
 */
export const UsuarioConPasswordSchema = UsuarioSchema.extend({
  password_hash: z.string(),
});

export type UsuarioConPassword = z.infer<typeof UsuarioConPasswordSchema>;

/**
 * Schema para crear un Usuario
 */
export const CreateUsuarioSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .max(100, 'Email no puede exceder 100 caracteres')
      .openapi({ example: 'admin@iglesia.cl' }),
    password: z
      .string()
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .max(100, 'La contraseña no puede exceder 100 caracteres')
      .openapi({ example: 'Password123' }),
    rol: z
      .enum(ROLES_USUARIO, {
        errorMap: () => ({
          message: 'Rol debe ser: administrador, lider o miembro',
        }),
      })
      .openapi({ example: 'administrador' }),
    miembro_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .optional()
      .openapi({ example: 5 }),
  }),
});

/**
 * Schema para obtener un Usuario por ID
 */
export const GetUsuarioSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Usuario (email y rol)
 */
export const UpdateUsuarioSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .max(100, 'Email no puede exceder 100 caracteres')
      .optional()
      .openapi({ example: 'nuevo@iglesia.cl' }),
    rol: z
      .enum(ROLES_USUARIO, {
        errorMap: () => ({
          message: 'Rol debe ser: administrador, lider o miembro',
        }),
      })
      .optional()
      .openapi({ example: 'lider' }),
  }),
});

/**
 * Schema para activar/desactivar un Usuario
 */
export const PatchEstadoUsuarioSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    activo: z
      .boolean({ required_error: 'El campo activo es obligatorio' })
      .openapi({ example: true }),
  }),
});
