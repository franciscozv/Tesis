import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal de Membresía en Grupo Ministerial
 */
export const MembresiaGrupoSchema = z.object({
  id_membresia: z.number(),
  miembro_id: z.number(),
  grupo_id: z.number(),
  rol_grupo_id: z.number(),
  fecha_vinculacion: z.string(),
  fecha_desvinculacion: z.string().nullable(),
});

export type MembresiaGrupo = z.infer<typeof MembresiaGrupoSchema>;

/**
 * Schema de membresía con nombres de grupo y rol (para consultas con JOIN)
 */
export const MembresiaGrupoConNombresSchema = z.object({
  id: z.number(),
  grupo: z.object({
    id: z.number(),
    nombre: z.string(),
  }),
  rol: z.object({
    id: z.number(),
    nombre: z.string(),
  }),
  fecha_vinculacion: z.string(),
  fecha_desvinculacion: z.string().nullable(),
});

export type MembresiaGrupoConNombres = z.infer<typeof MembresiaGrupoConNombresSchema>;

/**
 * Schema para vincular un miembro a un grupo ministerial (RF_06)
 * POST /api/membresia-grupo
 */
export const VincularMiembroSchema = z.object({
  body: z.object({
    miembro_id: z.number().int().positive('ID de miembro debe ser positivo'),
    grupo_id: z.number().int().positive('ID de grupo debe ser positivo'),
    rol_grupo_id: z.number().int().positive('ID de rol debe ser positivo'),
    fecha_vinculacion: z.string().datetime('Fecha de vinculación debe ser válida').optional(),
  }),
});

/**
 * Schema para desvincular un miembro de un grupo (RF_07)
 * PATCH /api/membresia-grupo/:id/desvincular
 */
export const DesvincularMiembroSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
  body: z.object({
    fecha_desvinculacion: z.string().datetime('Fecha de desvinculación debe ser válida').optional(),
  }),
});

/**
 * Schema para obtener membresías por miembro
 * GET /api/membresia-grupo/miembro/:miembro_id
 */
export const GetMembresiasByMiembroSchema = z.object({
  params: z.object({
    miembro_id: commonValidations.id,
  }),
});

/**
 * Schema para obtener membresías por grupo
 * GET /api/membresia-grupo/grupo/:grupo_id
 */
export const GetMembresiasByGrupoSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
  }),
});

/**
 * Schema para obtener una membresía por ID
 * GET /api/membresia-grupo/:id
 */
export const GetMembresiaSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
});

/**
 * Schema para cambiar el rol de una membresía activa
 * PATCH /api/membresia-grupo/:id/cambiar-rol
 */
export const CambiarRolMembresiaSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
  body: z.object({
    rol_grupo_id: z.number().int().positive('ID de rol debe ser positivo'),
  }),
});
