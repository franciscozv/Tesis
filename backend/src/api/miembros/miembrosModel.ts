import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

// Enum para estado de membresía
export const EstadoMembresiaEnum = z.enum(['sin_membresia', 'probando', 'plena_comunion']);
export type EstadoMembresia = z.infer<typeof EstadoMembresiaEnum>;

// Enum para género
export const GeneroEnum = z.enum(['masculino', 'femenino']);
export type Genero = z.infer<typeof GeneroEnum>;

/**
 * Schema principal para Miembro
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
  bautizado: z.boolean(),
  estado_membresia: EstadoMembresiaEnum,
  fecha_ingreso: z.string(), // ISO date string
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
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
    email: z
      .string()
      .email('Email inválido')
      .max(150)
      .optional()
      .transform((val) => val || null),
    telefono: z
      .string()
      .max(20)
      .optional()
      .transform((val) => val || null),
    fecha_nacimiento: z
      .string()
      .date('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
      .optional()
      .transform((val) => val || null),
    direccion: z
      .string()
      .optional()
      .transform((val) => val || null),
    genero: GeneroEnum.optional().transform((val) => val || null),
    bautizado: z.boolean().default(false),
    estado_membresia: EstadoMembresiaEnum.default('sin_membresia'),
    fecha_ingreso: z.string().date('Fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)'),
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
      .optional()
      .transform((val) => val || null),
    telefono: z
      .string()
      .max(20)
      .optional()
      .transform((val) => val || null),
    fecha_nacimiento: z
      .string()
      .date('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
      .optional()
      .transform((val) => val || null),
    direccion: z
      .string()
      .optional()
      .transform((val) => val || null),
    genero: GeneroEnum.optional().transform((val) => val || null),
    bautizado: z.boolean().optional(),
    estado_membresia: EstadoMembresiaEnum.optional(),
    fecha_ingreso: z
      .string()
      .date('Fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)')
      .optional(),
  }),
});

/**
 * Schema para cambiar el estado de membresía (RF_05)
 */
export const ChangeEstadoMembresiaSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    estado_membresia: EstadoMembresiaEnum,
  }),
});
