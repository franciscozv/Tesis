import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal de Rol de Grupo Ministerial
 */
export const RolGrupoSchema = z.object({
  id_rol_grupo: z.number(),
  nombre: z.string(),
  requiere_plena_comunion: z.boolean(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RolGrupo = z.infer<typeof RolGrupoSchema>;

/**
 * Schema para crear un rol de grupo
 * POST /api/roles-grupo
 */
export const CreateRolGrupoSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener mínimo 2 caracteres')
      .max(50, 'El nombre debe tener máximo 50 caracteres')
      .trim(),
    requiere_plena_comunion: z
      .boolean()
      .default(true)
      .describe('Indica si el rol requiere que el miembro tenga plena comunión'),
  }),
});

/**
 * Schema para actualizar un rol de grupo
 * PUT /api/roles-grupo/:id
 */
export const UpdateRolGrupoSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
  body: z.object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener mínimo 2 caracteres')
      .max(50, 'El nombre debe tener máximo 50 caracteres')
      .trim()
      .optional(),
    requiere_plena_comunion: z.boolean().optional(),
  }),
});

/**
 * Schema para obtener un rol por ID
 * GET /api/roles-grupo/:id
 */
export const GetRolGrupoSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
});

/**
 * Schema para cambiar estado (activo/inactivo) de un Rol de Grupo
 * PATCH /api/roles-grupo/:id/toggle-estado
 */
export const ToggleEstadoRolGrupoSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
});

/**
 * Schema para eliminar un rol (soft delete)
 * DELETE /api/roles-grupo/:id
 */
export const DeleteRolGrupoSchema = z.object({
  params: z.object({
    id: commonValidations.id,
  }),
});
