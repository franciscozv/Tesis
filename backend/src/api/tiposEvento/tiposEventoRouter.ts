import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { tiposEventoController } from './tiposEventoController';
import {
  CreateTipoEventoSchema,
  GetTipoEventoSchema,
  TipoEventoSchema,
  UpdateTipoEventoSchema,
} from './tiposEventoModel';

export const tiposEventoRegistry = new OpenAPIRegistry();
export const tiposEventoRouter: Router = express.Router();

tiposEventoRegistry.register('TipoEvento', TipoEventoSchema);

// GET /api/tipos-evento - Listar todos los tipos de evento activos
tiposEventoRegistry.registerPath({
  method: 'get',
  path: '/api/tipos-evento',
  tags: ['Tipos de Evento'],
  responses: createApiResponse(z.array(TipoEventoSchema), 'Success'),
});
tiposEventoRouter.get('/', tiposEventoController.getAll);

// GET /api/tipos-evento/:id - Obtener un tipo de evento por ID
tiposEventoRegistry.registerPath({
  method: 'get',
  path: '/api/tipos-evento/{id}',
  tags: ['Tipos de Evento'],
  request: { params: GetTipoEventoSchema.shape.params },
  responses: createApiResponse(TipoEventoSchema, 'Success'),
});
tiposEventoRouter.get('/:id', validateRequest(GetTipoEventoSchema), tiposEventoController.getById);

// POST /api/tipos-evento - Crear un nuevo tipo de evento
tiposEventoRegistry.registerPath({
  method: 'post',
  path: '/api/tipos-evento',
  tags: ['Tipos de Evento'],
  request: {
    body: { content: { 'application/json': { schema: CreateTipoEventoSchema.shape.body } } },
  },
  responses: createApiResponse(TipoEventoSchema, 'Success'),
});
tiposEventoRouter.post(
  '/',
  validateRequest(CreateTipoEventoSchema),
  tiposEventoController.create
);

// PUT /api/tipos-evento/:id - Actualizar un tipo de evento
tiposEventoRegistry.registerPath({
  method: 'put',
  path: '/api/tipos-evento/{id}',
  tags: ['Tipos de Evento'],
  request: {
    params: UpdateTipoEventoSchema.shape.params,
    body: { content: { 'application/json': { schema: UpdateTipoEventoSchema.shape.body } } },
  },
  responses: createApiResponse(TipoEventoSchema, 'Success'),
});
tiposEventoRouter.put(
  '/:id',
  validateRequest(UpdateTipoEventoSchema),
  tiposEventoController.update
);

// DELETE /api/tipos-evento/:id - Eliminar un tipo de evento (soft delete)
tiposEventoRegistry.registerPath({
  method: 'delete',
  path: '/api/tipos-evento/{id}',
  tags: ['Tipos de Evento'],
  request: { params: GetTipoEventoSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
tiposEventoRouter.delete(
  '/:id',
  validateRequest(GetTipoEventoSchema),
  tiposEventoController.delete
);
