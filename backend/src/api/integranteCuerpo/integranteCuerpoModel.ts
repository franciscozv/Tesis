import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal de Integrante en Cuerpo (anteriormente Membresía en Grupo)
 */
export const IntegranteCuerpoSchema = z.object({
  id_integrante: z.number(),
  miembro_id: z.number(),
  grupo_id: z.number(),
  rol_grupo_id: z.number(),
  fecha_vinculacion: z.string(),
  fecha_desvinculacion: z.string().nullable(),
});

export type IntegranteCuerpo = z.infer<typeof IntegranteCuerpoSchema>;

/**
 * Schema de integrante con nombres de grupo y rol (para consultas con JOIN)
 */
export const IntegranteCuerpoConNombresSchema = z.object({
  id: z.number(),
  miembro_id: z.number(),
  miembro: z
    .object({
      id: z.number(),
      nombre: z.string(),
      apellido: z.string(),
      rut: z.string(),
    })
    .optional(),
  grupo: z.object({
    id: z.number(),
    nombre: z.string(),
  }),
  rol: z.object({
    id: z.number(),
    nombre: z.string(),
    es_directiva: z.boolean(),
  }),
  fecha_vinculacion: z.string(),
  fecha_desvinculacion: z.string().nullable(),
});

export type IntegranteCuerpoConNombres = z.infer<typeof IntegranteCuerpoConNombresSchema>;

/**
 * Schema para vincular un miembro a un cuerpo/grupo ministerial (RF_06)
 * POST /api/integrantes-cuerpo
 */
export const VincularMiembroSchema = z.object({
  body: z.object({
    miembro_id: z.number().int().positive('ID de miembro debe ser positivo'),
    grupo_id: z.number().int().positive('ID de grupo debe ser positivo'),
    rol_grupo_id: z.number().int().positive('ID de rol debe ser positivo'),
    fecha_vinculacion: z
      .string()
      .datetime('Fecha de vinculación debe ser válida')
      .optional()
      .refine((val) => !val || new Date(val) <= new Date(), {
        message: 'La fecha de vinculación no puede ser una fecha futura.',
      }),
  }),
});

/**
 * Schema para desvincular un miembro de un grupo (RF_07)
 * PATCH /api/integrantes-cuerpo/:id/desvincular
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
 * Schema para obtener integraciones por miembro
 * GET /api/integrantes-cuerpo/miembro/:miembro_id
 */
export const GetIntegrantesByMiembroSchema = z.object({
  params: z.object({
    miembro_id: commonValidations.id,
  }),
});

/**
 * Schema para obtener integrantes por grupo
 * GET /api/integrantes-cuerpo/grupo/:grupo_id
 */
export const GetIntegrantesByGrupoSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
  }),
});

/**
 * Schema para obtener un integrante por ID
 * GET /api/integrantes-cuerpo/:id
 */
export const GetIntegranteSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
});

/**
 * Schema para cambiar el rol de una integración activa
 * PATCH /api/integrantes-cuerpo/:id/cambiar-rol
 */
export const CambiarRolIntegranteSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
  body: z.object({
    rol_grupo_id: z.number().int().positive('ID de rol debe ser positivo'),
  }),
});
