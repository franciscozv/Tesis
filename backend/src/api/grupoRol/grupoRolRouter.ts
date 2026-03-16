import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { RolGrupoSchema } from '@/api/rolesGrupo/rolesGrupoModel';
import { grupoRolController } from './grupoRolController';
import {
  DeshabilitarRolEnGrupoSchema,
  GetRolesPorGrupoSchema,
  GrupoRolSchema,
  HabilitarRolEnGrupoSchema,
} from './grupoRolModel';

export const grupoRolRegistry = new OpenAPIRegistry();
export const grupoRolRouter: Router = express.Router();

grupoRolRegistry.register('GrupoRol', GrupoRolSchema);

grupoRolRouter.use(verificarToken);

grupoRolRegistry.registerPath({
  method: 'get',
  path: '/api/grupo-rol/{grupo_id}',
  tags: ['Grupo Rol'],
  request: { params: GetRolesPorGrupoSchema.shape.params },
  responses: createApiResponse(z.array(RolGrupoSchema), 'Roles habilitados para el grupo'),
});
grupoRolRouter.get(
  '/:grupo_id',
  validateRequest(GetRolesPorGrupoSchema),
  grupoRolController.getRolesPorGrupo,
);

grupoRolRegistry.registerPath({
  method: 'post',
  path: '/api/grupo-rol',
  tags: ['Grupo Rol'],
  request: {
    body: {
      content: { 'application/json': { schema: HabilitarRolEnGrupoSchema.shape.body } },
    },
  },
  responses: createApiResponse(GrupoRolSchema, 'Rol habilitado exitosamente'),
});
grupoRolRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(HabilitarRolEnGrupoSchema),
  grupoRolController.habilitarRol,
);

grupoRolRegistry.registerPath({
  method: 'delete',
  path: '/api/grupo-rol/{grupo_id}/{rol_grupo_id}',
  tags: ['Grupo Rol'],
  request: { params: DeshabilitarRolEnGrupoSchema.shape.params },
  responses: createApiResponse(z.boolean(), 'Rol deshabilitado exitosamente'),
});
grupoRolRouter.delete(
  '/:grupo_id/:rol_grupo_id',
  verificarRol('administrador'),
  validateRequest(DeshabilitarRolEnGrupoSchema),
  grupoRolController.deshabilitarRol,
);
