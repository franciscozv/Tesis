import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { necesidadesLogisticasController } from './necesidadesLogisticasController';
import {
  CreateNecesidadLogisticaSchema,
  GetNecesidadLogisticaSchema,
  ListNecesidadesQuerySchema,
  NecesidadLogisticaSchema,
  PatchEstadoNecesidadSchema,
  UpdateNecesidadLogisticaSchema,
} from './necesidadesLogisticasModel';

export const necesidadesLogisticasRegistry = new OpenAPIRegistry();
export const necesidadesLogisticasRouter: Router = express.Router();

// Registrar schema en OpenAPI
necesidadesLogisticasRegistry.register('NecesidadMaterial', NecesidadLogisticaSchema);

// Todas las rutas requieren autenticación
necesidadesLogisticasRouter.use(verificarToken);

// GET /api/necesidades/abiertas - Necesidades abiertas próximos 60 días (antes de /:id)
necesidadesLogisticasRegistry.registerPath({
  method: 'get',
  path: '/api/necesidades/abiertas',
  tags: ['Necesidades Materiales'],
  summary: 'Obtener necesidades abiertas de actividades en los próximos 60 días',
  responses: createApiResponse(z.array(NecesidadLogisticaSchema), 'Success'),
});
necesidadesLogisticasRouter.get('/abiertas', necesidadesLogisticasController.getAbiertas);

// GET /api/necesidades - Listar con filtros
necesidadesLogisticasRegistry.registerPath({
  method: 'get',
  path: '/api/necesidades',
  tags: ['Necesidades Materiales'],
  summary: 'Obtener necesidades materiales con filtros opcionales (estado, actividad_id)',
  request: {
    query: ListNecesidadesQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(NecesidadLogisticaSchema), 'Success'),
});
necesidadesLogisticasRouter.get(
  '/',
  validateRequest(ListNecesidadesQuerySchema),
  necesidadesLogisticasController.getAll,
);

// GET /api/necesidades/:id - Obtener una por ID
necesidadesLogisticasRegistry.registerPath({
  method: 'get',
  path: '/api/necesidades/{id}',
  tags: ['Necesidades Materiales'],
  summary: 'Obtener una necesidad material por ID',
  request: { params: GetNecesidadLogisticaSchema.shape.params },
  responses: createApiResponse(NecesidadLogisticaSchema, 'Success'),
});
necesidadesLogisticasRouter.get(
  '/:id',
  validateRequest(GetNecesidadLogisticaSchema),
  necesidadesLogisticasController.getById,
);

// POST /api/necesidades - Crear
necesidadesLogisticasRegistry.registerPath({
  method: 'post',
  path: '/api/necesidades',
  tags: ['Necesidades Materiales'],
  summary: 'Crear una nueva necesidad material',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateNecesidadLogisticaSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(NecesidadLogisticaSchema, 'Success'),
});
necesidadesLogisticasRouter.post(
  '/',
  verificarRol('administrador', 'usuario'),
  validateRequest(CreateNecesidadLogisticaSchema),
  necesidadesLogisticasController.create,
);

// PUT /api/necesidades/:id - Actualizar
necesidadesLogisticasRegistry.registerPath({
  method: 'put',
  path: '/api/necesidades/{id}',
  tags: ['Necesidades Materiales'],
  summary: 'Actualizar una necesidad material',
  request: {
    params: UpdateNecesidadLogisticaSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateNecesidadLogisticaSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(NecesidadLogisticaSchema, 'Success'),
});
necesidadesLogisticasRouter.put(
  '/:id',
  verificarRol('administrador', 'usuario'),
  validateRequest(UpdateNecesidadLogisticaSchema),
  necesidadesLogisticasController.update,
);

// PATCH /api/necesidades/:id/estado - Cambiar estado
necesidadesLogisticasRegistry.registerPath({
  method: 'patch',
  path: '/api/necesidades/{id}/estado',
  tags: ['Necesidades Materiales'],
  summary: 'Cambiar estado de una necesidad material',
  request: {
    params: PatchEstadoNecesidadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchEstadoNecesidadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(NecesidadLogisticaSchema, 'Success'),
});
necesidadesLogisticasRouter.patch(
  '/:id/estado',
  verificarRol('administrador', 'usuario'),
  validateRequest(PatchEstadoNecesidadSchema),
  necesidadesLogisticasController.updateEstado,
);

// DELETE /api/necesidades/:id - Eliminar (solo si abierta)
necesidadesLogisticasRegistry.registerPath({
  method: 'delete',
  path: '/api/necesidades/{id}',
  tags: ['Necesidades Materiales'],
  summary: 'Eliminar una necesidad material (solo si está en estado abierta)',
  request: { params: GetNecesidadLogisticaSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
necesidadesLogisticasRouter.delete(
  '/:id',
  verificarRol('administrador', 'usuario'),
  validateRequest(GetNecesidadLogisticaSchema),
  necesidadesLogisticasController.delete,
);
