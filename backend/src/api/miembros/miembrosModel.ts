import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

// Enum para estado de comunión (anteriormente membresía)
export const EstadoComunionEnum = z.enum(['asistente', 'probando', 'plena_comunion']);
export type EstadoComunion = z.infer<typeof EstadoComunionEnum>;

// Enum para género
export const GeneroEnum = z.enum(['masculino', 'femenino']);
export type Genero = z.infer<typeof GeneroEnum>;

/**
 * Schema principal para Miembro (incluye campos de cuenta opcionales)
 */
export const MiembroSchema = z.object({
  id: z.number(),
  rut: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().nullable(),
  telefono: z.string().nullable(),
  fecha_nacimiento: z.string().nullable(), // ISO date string
  direccion: z.string().nullable(),
  genero: GeneroEnum.nullable(),
  estado_comunion: EstadoComunionEnum,
  fecha_ingreso: z.string(), // ISO date string
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  // Campos de cuenta (null = sin acceso al sistema)
  rol: z.enum(['administrador', 'usuario']).nullable(),
  fecha_creacion: z.string().nullable(),
  ultimo_acceso: z.string().nullable(),
});

export type Miembro = z.infer<typeof MiembroSchema>;

/**
 * Schema para obtener un miembro por ID
 */
export const GetMiembroSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para crear un nuevo miembro
 */
export const CreateMiembroSchema = z.object({
  body: z.object({
    rut: z
      .string()
      .regex(/^\d{7,8}-[\dkK]$/, 'Formato de RUT inválido. Debe ser: 12345678-9 o 12345678-k')
      .min(9)
      .max(10),
    nombre: z.string().min(2, 'Nombre debe tener mínimo 2 caracteres').max(100),
    apellido: z.string().min(2, 'Apellido debe tener mínimo 2 caracteres').max(100),
    email: z.string().email('Email inválido').max(150),
    telefono: z
      .string()
      .max(20)
      .optional()
      .transform((val) => val || null),
    fecha_nacimiento: z
      .string()
      .date('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
      .optional()
      .transform((val) => val || null)
      .refine((date) => {
        if (!date) return true;
        const [year, month, day] = date.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate <= today;
      }, 'La fecha de nacimiento no puede ser futura'),
    direccion: z
      .string()
      .optional()
      .transform((val) => val || null),
    genero: GeneroEnum.optional().transform((val) => val || null),
    estado_comunion: EstadoComunionEnum.default('asistente'),
    rol: z
      .enum(['administrador', 'usuario'], {
        errorMap: () => ({ message: 'Rol debe ser: administrador o usuario' }),
      })
      .default('usuario'),
    fecha_ingreso: z
      .string()
      .date('Fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)')
      .refine((date) => {
        const [year, month, day] = date.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate <= today;
      }, 'La fecha de ingreso no puede ser futura'),
  }),
});

/**
 * Schema para actualizar un miembro existente
 */
export const UpdateMiembroSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    rut: z
      .string()
      .regex(/^\d{7,8}-[\dkK]$/, 'Formato de RUT inválido. Debe ser: 12345678-9 o 12345678-k')
      .min(9)
      .max(10)
      .optional(),
    nombre: z.string().min(2, 'Nombre debe tener mínimo 2 caracteres').max(100).optional(),
    apellido: z.string().min(2, 'Apellido debe tener mínimo 2 caracteres').max(100).optional(),
    email: z
      .string()
      .email('Email inválido')
      .max(150)
      .nullish()
      .transform((val) => val ?? null),
    telefono: z
      .string()
      .max(20)
      .nullish()
      .transform((val) => val ?? null),
    fecha_nacimiento: z
      .string()
      .date('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
      .nullish()
      .transform((val) => val ?? null)
      .refine((date) => {
        if (!date) return true;
        const [year, month, day] = date.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate <= today;
      }, 'La fecha de nacimiento no puede ser futura'),
    direccion: z
      .string()
      .nullish()
      .transform((val) => val ?? null),
    genero: GeneroEnum.nullish().transform((val) => val ?? null),
    fecha_ingreso: z
      .string()
      .date('Fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)')
      .optional()
      .refine((date) => {
        if (!date) return true;
        const [year, month, day] = date.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate <= today;
      }, 'La fecha de ingreso no puede ser futura'),
  }),
});

/**
 * Schema para actualizar perfil propio (solo datos de contacto)
 */
export const UpdateMiPerfilSchema = z.object({
  body: z.object({
    direccion: z
      .string()
      .max(300)
      .optional()
      .transform((val) => val || null),
    telefono: z
      .string()
      .regex(
        /^\+56\s?9\s?\d{4}\s?\d{4}$/,
        'Formato de teléfono inválido. Debe ser: +56 9 XXXX XXXX',
      )
      .optional()
      .transform((val) => val || null),
    email: z
      .string()
      .email('Email inválido')
      .max(150)
      .optional()
      .transform((val) => val || null),
  }),
});

/**
 * Schema para query params de listado paginado de miembros
 */
export const GetMiembrosQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    estado_comunion: EstadoComunionEnum.optional(),
    incluir_inactivos: z.coerce.boolean().default(false),
  }),
});

export type GetMiembrosQuery = z.infer<typeof GetMiembrosQuerySchema>['query'];

/**
 * Resultado de la operación de eliminación (soft o hard delete)
 */
export interface DeleteMiembroResult {
  tipo: 'inactivado' | 'eliminado';
  tieneDependencias: boolean;
}

export interface PaginatedMiembrosResponse {
  data: Miembro[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Schema para cambiar el estado de comunión (RF_05)
 */
export const ChangeEstadoComunionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    estado_nuevo: EstadoComunionEnum,
    motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres').max(500),
  }),
});

/**
 * Schema para actualizar cuenta de acceso (email y/o rol)
 */
export const UpdateCuentaSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .max(150)
      .optional()
      .openapi({ example: 'nuevo@iglesia.cl' }),
    rol: z
      .enum(['administrador', 'usuario'], {
        errorMap: () => ({ message: 'Rol debe ser: administrador o usuario' }),
      })
      .optional()
      .openapi({ example: 'usuario' }),
  }),
});

/**
 * Schema para restablecer la contraseÃ±a de un miembro (admin)
 */
export const ResetPasswordMiembroSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nueva_password: z.string().min(8, 'La contraseÃ±a debe tener al menos 8 caracteres').max(100),
  }),
});
