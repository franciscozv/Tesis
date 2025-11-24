import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { grupoMinisterialController } from '@/api/gruposMinisteriales/grupoMinisterialController';
import {
  CreateGrupoMinisterialSchema,
  GetGrupoMinisterialSchema,
  GrupoMinisterialSchema,
  UpdateGrupoMinisterialSchema,
} from '@/api/gruposMinisteriales/grupoMinisterialModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';

export const gruposMinisterialesRegistry = new OpenAPIRegistry();
export const gruposMinisterialesRouter: Router = express.Router();

// Registrar schema principal
gruposMinisterialesRegistry.register('GrupoMinisterial', GrupoMinisterialSchema);

/**
 * GET /api/grupos-ministeriales - Obtiene todos los grupos ministeriales activos
 */
gruposMinisterialesRegistry.registerPath({
  method: 'get',
  path: '/api/grupos-ministeriales',
  tags: ['Grupos Ministeriales'],
  responses: createApiResponse(z.array(GrupoMinisterialSchema), 'Success'),
});
gruposMinisterialesRouter.get('/', grupoMinisterialController.getAll);

/**
 * GET /api/grupos-ministeriales/:id - Obtiene un grupo ministerial por ID
 */
gruposMinisterialesRegistry.registerPath({
  method: 'get',
  path: '/api/grupos-ministeriales/{id}',
  tags: ['Grupos Ministeriales'],
  request: { params: GetGrupoMinisterialSchema.shape.params },
  responses: createApiResponse(GrupoMinisterialSchema, 'Success'),
});
gruposMinisterialesRouter.get(
  '/:id',
  validateRequest(GetGrupoMinisterialSchema),
  grupoMinisterialController.getById,
);

/**
 * POST /api/grupos-ministeriales - Crea un nuevo grupo ministerial
 */
gruposMinisterialesRegistry.registerPath({
  method: 'post',
  path: '/api/grupos-ministeriales',
  tags: ['Grupos Ministeriales'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateGrupoMinisterialSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(
    GrupoMinisterialSchema,
    'Grupo ministerial creado exitosamente',
    201,
  ),
});
gruposMinisterialesRouter.post(
  '/',
  validateRequest(CreateGrupoMinisterialSchema),
  grupoMinisterialController.create,
);

/**
 * PUT /api/grupos-ministeriales/:id - Actualiza un grupo ministerial existente
 */
gruposMinisterialesRegistry.registerPath({
  method: 'put',
  path: '/api/grupos-ministeriales/{id}',
  tags: ['Grupos Ministeriales'],
  request: {
    params: UpdateGrupoMinisterialSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateGrupoMinisterialSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(
    GrupoMinisterialSchema,
    'Grupo ministerial actualizado exitosamente',
  ),
});
gruposMinisterialesRouter.put(
  '/:id',
  validateRequest(UpdateGrupoMinisterialSchema),
  grupoMinisterialController.update,
);

/**
 * DELETE /api/grupos-ministeriales/:id - Elimina lógicamente un grupo ministerial (soft delete)
 */
gruposMinisterialesRegistry.registerPath({
  method: 'delete',
  path: '/api/grupos-ministeriales/{id}',
  tags: ['Grupos Ministeriales'],
  request: { params: GetGrupoMinisterialSchema.shape.params },
  responses: createApiResponse(z.null(), 'Grupo ministerial eliminado exitosamente'),
});
gruposMinisterialesRouter.delete(
  '/:id',
  validateRequest(GetGrupoMinisterialSchema),
  grupoMinisterialController.delete,
);
