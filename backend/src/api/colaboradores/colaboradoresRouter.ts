import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { colaboradoresController } from './colaboradoresController';
import {
  ColaboradorSchema,
  CreateColaboradorSchema,
  GetColaboradorSchema,
  ListColaboradoresQuerySchema,
  PatchCumplioColaboradorSchema,
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
  summary: 'Obtener compromisos de colaboración con filtros opcionales (necesidad_id, miembro_id)',
  request: {
    query: ListColaboradoresQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(ColaboradorSchema), 'Success'),
});
colaboradoresRouter.get(
  '/',
  validateRequest(ListColaboradoresQuerySchema),
  colaboradoresController.getAll,
);

// GET /api/colaboradores/:id - Obtener uno por ID
colaboradoresRegistry.registerPath({
  method: 'get',
  path: '/api/colaboradores/{id}',
  tags: ['Colaboradores'],
  summary: 'Obtener un compromiso de colaboración por ID',
  request: { params: GetColaboradorSchema.shape.params },
  responses: createApiResponse(ColaboradorSchema, 'Success'),
});
colaboradoresRouter.get(
  '/:id',
  validateRequest(GetColaboradorSchema),
  colaboradoresController.getById,
);

// POST /api/colaboradores - Registrar compromiso
colaboradoresRegistry.registerPath({
  method: 'post',
  path: '/api/colaboradores',
  tags: ['Colaboradores'],
  summary: 'Registrar un compromiso de colaboración (confirmado automáticamente)',
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
  colaboradoresController.create,
);

// PATCH /api/colaboradores/:id/cumplio - Marcar si cumplió
colaboradoresRegistry.registerPath({
  method: 'patch',
  path: '/api/colaboradores/{id}/cumplio',
  tags: ['Colaboradores'],
  summary: 'Marcar si un colaborador cumplió su compromiso (verificación post-actividad)',
  request: {
    params: PatchCumplioColaboradorSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchCumplioColaboradorSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ColaboradorSchema, 'Success'),
});
colaboradoresRouter.patch(
  '/:id/cumplio',
  verificarRol('administrador', 'usuario'),
  validateRequest(PatchCumplioColaboradorSchema),
  colaboradoresController.marcarCumplio,
);

// DELETE /api/colaboradores/:id - Eliminar compromiso
colaboradoresRegistry.registerPath({
  method: 'delete',
  path: '/api/colaboradores/{id}',
  tags: ['Colaboradores'],
  summary: 'Eliminar un compromiso de colaboración',
  request: { params: GetColaboradorSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
colaboradoresRouter.delete(
  '/:id',
  validateRequest(GetColaboradorSchema),
  colaboradoresController.delete,
);
