import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { iglesiasController } from './iglesiasController';
import {
  CreateIglesiaSchema,
  GetIglesiaSchema,
  GetLocalesByTemploSchema,
  IglesiaConPadreSchema,
  IglesiaSchema,
  UpdateIglesiaSchema,
} from './iglesiasModel';

export const iglesiasRegistry = new OpenAPIRegistry();
export const iglesiasRouter: Router = express.Router();

iglesiasRegistry.register('Iglesia', IglesiaSchema);
iglesiasRegistry.register('IglesiaConPadre', IglesiaConPadreSchema);

// GET /api/iglesias - Listar todas las iglesias activas
iglesiasRegistry.registerPath({
  method: 'get',
  path: '/api/iglesias',
  tags: ['Iglesias'],
  responses: createApiResponse(z.array(IglesiaSchema), 'Success'),
});
iglesiasRouter.get('/', iglesiasController.getAll);

// GET /api/iglesias/templos - Listar solo templos centrales
iglesiasRegistry.registerPath({
  method: 'get',
  path: '/api/iglesias/templos',
  tags: ['Iglesias'],
  responses: createApiResponse(z.array(IglesiaSchema), 'Success'),
});
iglesiasRouter.get('/templos', iglesiasController.getTemplos);

// GET /api/iglesias/locales/:iglesia_id - Listar locales de un templo
iglesiasRegistry.registerPath({
  method: 'get',
  path: '/api/iglesias/locales/{iglesia_id}',
  tags: ['Iglesias'],
  request: { params: GetLocalesByTemploSchema.shape.params },
  responses: createApiResponse(z.array(IglesiaSchema), 'Success'),
});
iglesiasRouter.get(
  '/locales/:iglesia_id',
  validateRequest(GetLocalesByTemploSchema),
  iglesiasController.getLocalesByTemplo
);

// GET /api/iglesias/:id - Obtener una iglesia por ID (con templo padre si aplica)
iglesiasRegistry.registerPath({
  method: 'get',
  path: '/api/iglesias/{id}',
  tags: ['Iglesias'],
  request: { params: GetIglesiaSchema.shape.params },
  responses: createApiResponse(IglesiaConPadreSchema, 'Success'),
});
iglesiasRouter.get('/:id', validateRequest(GetIglesiaSchema), iglesiasController.getById);

// POST /api/iglesias - Crear una nueva iglesia (templo o local)
iglesiasRegistry.registerPath({
  method: 'post',
  path: '/api/iglesias',
  tags: ['Iglesias'],
  request: {
    body: { content: { 'application/json': { schema: CreateIglesiaSchema.shape.body } } },
  },
  responses: createApiResponse(IglesiaSchema, 'Success'),
});
iglesiasRouter.post('/', validateRequest(CreateIglesiaSchema), iglesiasController.create);

// PUT /api/iglesias/:id - Actualizar una iglesia
iglesiasRegistry.registerPath({
  method: 'put',
  path: '/api/iglesias/{id}',
  tags: ['Iglesias'],
  request: {
    params: UpdateIglesiaSchema.shape.params,
    body: { content: { 'application/json': { schema: UpdateIglesiaSchema.shape.body } } },
  },
  responses: createApiResponse(IglesiaSchema, 'Success'),
});
iglesiasRouter.put('/:id', validateRequest(UpdateIglesiaSchema), iglesiasController.update);

// DELETE /api/iglesias/:id - Eliminar una iglesia (soft delete)
iglesiasRegistry.registerPath({
  method: 'delete',
  path: '/api/iglesias/{id}',
  tags: ['Iglesias'],
  request: { params: GetIglesiaSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
iglesiasRouter.delete('/:id', validateRequest(GetIglesiaSchema), iglesiasController.delete);
