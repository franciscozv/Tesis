import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal de Integrante en Grupo (anteriormente Membresía en Grupo)
 */
export const IntegranteGrupoSchema = z.object({
  id_integrante: z.number(),
  miembro_id: z.number(),
  grupo_id: z.number(),
  rol_grupo_id: z.number(),
  fecha_vinculacion: z.string(),
  fecha_desvinculacion: z.string().nullable(),
});

export type IntegranteGrupo = z.infer<typeof IntegranteGrupoSchema>;

/**
 * Schema de integrante con nombres de grupo y rol (para consultas con JOIN)
 */
export const IntegranteGrupoConNombresSchema = z.object({
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

export type IntegranteGrupoConNombres = z.infer<typeof IntegranteGrupoConNombresSchema>;

/**
 * Schema para vincular un miembro a un grupo/grupo ministerial (RF_06)
 * POST /api/integrantes-grupo
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
 * PATCH /api/integrantes-grupo/:id/desvincular
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
 * GET /api/integrantes-grupo/miembro/:miembro_id
 */
export const GetIntegrantesByMiembroSchema = z.object({
  params: z.object({
    miembro_id: commonValidations.id,
  }),
});

/**
 * Schema para obtener integrantes por grupo
 * GET /api/integrantes-grupo/grupo/:grupo_id
 */
export const GetIntegrantesByGrupoSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
  }),
});

/**
 * Schema para obtener un integrante por ID
 * GET /api/integrantes-grupo/:id
 */
export const GetIntegranteSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
});

/**
 * Schema para cambiar el rol de una integración activa
 * PATCH /api/integrantes-grupo/:id/cambiar-rol
 */
export const CambiarRolIntegranteSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
  body: z.object({
    rol_grupo_id: z.number().int().positive('ID de rol debe ser positivo'),
  }),
});

/**
 * Schema para renovación masiva de directiva
 * POST /api/integrantes-grupo/grupo/:grupo_id/renovar-directiva
 */
export const RenovarDirectivaMasivaSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
  }),
  body: z.object({
    renovaciones: z
      .array(
        z.object({
          cargo_id: z.number().int().positive('ID de cargo debe ser positivo'),
          nuevo_miembro_id: z.number().int().positive('ID de miembro debe ser positivo'),
        }),
      )
      .min(1, 'Debe incluir al menos una renovación'),
    fecha: z.string().datetime('Fecha debe ser válida').optional(),
  }),
});

export type RenovarDirectivaItem = {
  cargo_id: number;
  nuevo_miembro_id: number;
};

/**
 * Schema para historial de directiva de un grupo
 * GET /api/integrantes-grupo/grupo/:grupo_id/historial-directiva
 */
export const GetHistorialDirectivaSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
  }),
});
