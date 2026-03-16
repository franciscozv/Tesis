import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

export const GrupoRolSchema = z.object({
  grupo_id: z.number(),
  rol_grupo_id: z.number(),
  created_at: z.string(),
});

export type GrupoRol = z.infer<typeof GrupoRolSchema>;

export const HabilitarRolEnGrupoSchema = z.object({
  body: z.object({
    grupo_id: z.number().int().positive('ID de grupo debe ser positivo'),
    rol_grupo_id: z.number().int().positive('ID de rol debe ser positivo'),
  }),
});

export const GetRolesPorGrupoSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
  }),
});

export const DeshabilitarRolEnGrupoSchema = z.object({
  params: z.object({
    grupo_id: commonValidations.id,
    rol_grupo_id: commonValidations.id,
  }),
});
