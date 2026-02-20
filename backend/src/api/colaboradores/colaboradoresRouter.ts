import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { colaboradoresController } from './colaboradoresController';
import {
  ColaboradorSchema,
  CreateColaboradorSchema,
  GetColaboradorSchema,
  ListColaboradoresQuerySchema,
  PatchDecisionColaboradorSchema,
} from './colaboradoresModel';

export const colaboradoresRegistry = new OpenAPIRegistry();
export const colaboradoresRouter: Router = express.Router();

// Registrar schema en OpenAPI
colaboradoresRegistry.register('Colaborador', ColaboradorSchema);

// Todas las rutas requieren autenticación
colaboradoresRouter.use(verificarToken);

// GET /api/colaboradores - Listar con filtros
colaboradoresRegistry.registerPath({
  method: 'get',
  path: '/api/colaboradores',
  tags: ['Colaboradores'],
  summary: 'Obtener colaboradores con filtros opcionales (necesidad_id, miembro_id, estado)',
  request: {
    query: ListColaboradoresQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(ColaboradorSchema), 'Success'),
});
colaboradoresRouter.get(
  '/',
  validateRequest(ListColaboradoresQuerySchema),
  colaboradoresController.getAll
);

// GET /api/colaboradores/:id - Obtener uno por ID
colaboradoresRegistry.registerPath({
  method: 'get',
  path: '/api/colaboradores/{id}',
  tags: ['Colaboradores'],
  summary: 'Obtener un colaborador por ID',
  request: { params: GetColaboradorSchema.shape.params },
  responses: createApiResponse(ColaboradorSchema, 'Success'),
});
colaboradoresRouter.get(
  '/:id',
  validateRequest(GetColaboradorSchema),
  colaboradoresController.getById
);

// POST /api/colaboradores - Crear oferta voluntaria
colaboradoresRegistry.registerPath({
  method: 'post',
  path: '/api/colaboradores',
  tags: ['Colaboradores'],
  summary: 'Registrar una oferta voluntaria de colaboración',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateColaboradorSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ColaboradorSchema, 'Success'),
});
colaboradoresRouter.post(
  '/',
  validateRequest(CreateColaboradorSchema),
  colaboradoresController.create
);

// PATCH /api/colaboradores/:id/decision - Aceptar o rechazar oferta
colaboradoresRegistry.registerPath({
  method: 'patch',
  path: '/api/colaboradores/{id}/decision',
  tags: ['Colaboradores'],
  summary: 'Aceptar o rechazar una oferta de colaboración',
  request: {
    params: PatchDecisionColaboradorSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchDecisionColaboradorSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ColaboradorSchema, 'Success'),
});
colaboradoresRouter.patch(
  '/:id/decision',
  verificarRol('administrador', 'lider'),
  validateRequest(PatchDecisionColaboradorSchema),
  colaboradoresController.updateDecision
);

// DELETE /api/colaboradores/:id - Eliminar (solo si pendiente)
colaboradoresRegistry.registerPath({
  method: 'delete',
  path: '/api/colaboradores/{id}',
  tags: ['Colaboradores'],
  summary: 'Eliminar una oferta de colaboración (solo si está pendiente)',
  request: { params: GetColaboradorSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
colaboradoresRouter.delete(
  '/:id',
  validateRequest(GetColaboradorSchema),
  colaboradoresController.delete
);
