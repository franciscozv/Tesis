import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { actividadesController } from './actividadesController';
import {
  ActividadSchema,
  CreateActividadSchema,
  GetActividadSchema,
  ListActividadesQuerySchema,
  PatchEstadoActividadSchema,
  UpdateActividadSchema,
} from './actividadesModel';

export const actividadesRegistry = new OpenAPIRegistry();
export const actividadesRouter: Router = express.Router();

// Registrar schema en OpenAPI
actividadesRegistry.register('Actividad', ActividadSchema);

// GET /api/actividades/publicas - Obtener actividades públicas (antes de /:id para evitar conflicto)
actividadesRegistry.registerPath({
  method: 'get',
  path: '/api/actividades/publicas',
  tags: ['Actividades'],
  summary: 'Obtener actividades públicas programadas futuras',
  responses: createApiResponse(z.array(ActividadSchema), 'Success'),
});
actividadesRouter.get('/publicas', actividadesController.getPublicas);

// GET /api/actividades - Listar actividades con filtros
actividadesRegistry.registerPath({
  method: 'get',
  path: '/api/actividades',
  tags: ['Actividades'],
  summary: 'Obtener actividades con filtros opcionales (mes, anio, estado, es_publica)',
  request: {
    query: ListActividadesQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(ActividadSchema), 'Success'),
});
actividadesRouter.get('/', verificarToken, validateRequest(ListActividadesQuerySchema), actividadesController.getAll);

// GET /api/actividades/:id - Obtener una actividad por ID
actividadesRegistry.registerPath({
  method: 'get',
  path: '/api/actividades/{id}',
  tags: ['Actividades'],
  summary: 'Obtener una actividad por ID',
  request: { params: GetActividadSchema.shape.params },
  responses: createApiResponse(ActividadSchema, 'Success'),
});
actividadesRouter.get(
  '/:id',
  verificarToken,
  validateRequest(GetActividadSchema),
  actividadesController.getById
);

// POST /api/actividades - Crear una nueva actividad
actividadesRegistry.registerPath({
  method: 'post',
  path: '/api/actividades',
  tags: ['Actividades'],
  summary: 'Crear una nueva actividad',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ActividadSchema, 'Success'),
});
actividadesRouter.post(
  '/',
  verificarToken,
  verificarRol('administrador', 'lider'),
  validateRequest(CreateActividadSchema),
  actividadesController.create
);

// PUT /api/actividades/:id - Actualizar una actividad
actividadesRegistry.registerPath({
  method: 'put',
  path: '/api/actividades/{id}',
  tags: ['Actividades'],
  summary: 'Actualizar una actividad',
  request: {
    params: UpdateActividadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ActividadSchema, 'Success'),
});
actividadesRouter.put(
  '/:id',
  verificarToken,
  verificarRol('administrador', 'lider'),
  validateRequest(UpdateActividadSchema),
  actividadesController.update
);

// PATCH /api/actividades/:id/estado - Cambiar estado de una actividad
actividadesRegistry.registerPath({
  method: 'patch',
  path: '/api/actividades/{id}/estado',
  tags: ['Actividades'],
  summary: 'Cambiar estado de una actividad (requiere motivo si es cancelada)',
  request: {
    params: PatchEstadoActividadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchEstadoActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ActividadSchema, 'Success'),
});
actividadesRouter.patch(
  '/:id/estado',
  verificarToken,
  verificarRol('administrador', 'lider'),
  validateRequest(PatchEstadoActividadSchema),
  actividadesController.updateEstado
);
