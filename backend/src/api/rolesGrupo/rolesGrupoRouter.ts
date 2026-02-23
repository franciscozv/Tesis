import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { rolesGrupoController } from './rolesGrupoController';
import {
  CreateRolGrupoSchema,
  DeleteRolGrupoSchema,
  GetRolGrupoSchema,
  RolGrupoSchema,
  ToggleEstadoRolGrupoSchema,
  UpdateRolGrupoSchema,
} from './rolesGrupoModel';

export const rolesGrupoRegistry = new OpenAPIRegistry();
export const rolesGrupoRouter: Router = express.Router();

// Registrar schema principal
rolesGrupoRegistry.register('RolGrupo', RolGrupoSchema);

// Todas las rutas requieren autenticación
rolesGrupoRouter.use(verificarToken);

/**
 * GET /api/roles-grupo - Listar todos los roles activos
 * Permisos: admin, secretario, lider
 */
rolesGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/roles-grupo',
  tags: ['Roles de Grupo'],
  responses: createApiResponse(z.array(RolGrupoSchema), 'Roles de grupo encontrados'),
});
rolesGrupoRouter.get('/', rolesGrupoController.getAll);

/**
 * GET /api/roles-grupo/:id - Obtener un rol por ID
 */
rolesGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/roles-grupo/{id}',
  tags: ['Roles de Grupo'],
  request: {
    params: GetRolGrupoSchema.shape.params,
  },
  responses: createApiResponse(RolGrupoSchema, 'Rol de grupo encontrado'),
});
rolesGrupoRouter.get('/:id', validateRequest(GetRolGrupoSchema), rolesGrupoController.getById);

/**
 * POST /api/roles-grupo - Crear un nuevo rol
 */
rolesGrupoRegistry.registerPath({
  method: 'post',
  path: '/api/roles-grupo',
  tags: ['Roles de Grupo'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRolGrupoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(RolGrupoSchema, 'Rol de grupo creado exitosamente'),
});
rolesGrupoRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateRolGrupoSchema),
  rolesGrupoController.create,
);

/**
 * PUT /api/roles-grupo/:id - Actualizar un rol
 * Permisos: admin, secretario
 */
rolesGrupoRegistry.registerPath({
  method: 'put',
  path: '/api/roles-grupo/{id}',
  tags: ['Roles de Grupo'],
  request: {
    params: UpdateRolGrupoSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateRolGrupoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(RolGrupoSchema, 'Rol de grupo actualizado exitosamente'),
});
rolesGrupoRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdateRolGrupoSchema),
  rolesGrupoController.update,
);

/**
 * PATCH /api/roles-grupo/:id/toggle-estado - Cambiar estado activo/inactivo
 */
rolesGrupoRegistry.registerPath({
  method: 'patch',
  path: '/api/roles-grupo/{id}/toggle-estado',
  tags: ['Roles de Grupo'],
  summary: 'Cambiar estado activo/inactivo de un rol de grupo',
  request: { params: ToggleEstadoRolGrupoSchema.shape.params },
  responses: createApiResponse(RolGrupoSchema, 'Estado cambiado exitosamente'),
});
rolesGrupoRouter.patch(
  '/:id/toggle-estado',
  verificarRol('administrador'),
  validateRequest(ToggleEstadoRolGrupoSchema),
  rolesGrupoController.toggleEstado,
);

/**
 * DELETE /api/roles-grupo/:id - Eliminar un rol (soft delete)
 */
rolesGrupoRegistry.registerPath({
  method: 'delete',
  path: '/api/roles-grupo/{id}',
  tags: ['Roles de Grupo'],
  request: {
    params: DeleteRolGrupoSchema.shape.params,
  },
  responses: createApiResponse(z.null(), 'Rol de grupo eliminado exitosamente'),
});
rolesGrupoRouter.delete(
  '/:id',
  verificarRol('administrador'),
  validateRequest(DeleteRolGrupoSchema),
  rolesGrupoController.delete,
);
