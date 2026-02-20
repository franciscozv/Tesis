import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { historialRolGrupoController } from './historialRolGrupoController';
import {
  CreateHistorialRolGrupoSchema,
  GetHistorialRolGrupoSchema,
  HistorialRolGrupoSchema,
  ListHistorialRolGrupoQuerySchema,
} from './historialRolGrupoModel';

export const historialRolGrupoRegistry = new OpenAPIRegistry();
export const historialRolGrupoRouter: Router = express.Router();

// Registrar schema en OpenAPI
historialRolGrupoRegistry.register('HistorialRolGrupo', HistorialRolGrupoSchema);

// Todas las rutas requieren autenticación + rol administrador o lider
historialRolGrupoRouter.use(verificarToken, verificarRol('administrador', 'lider'));

// GET /api/historial-rol-grupo - Listar con filtros
historialRolGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/historial-rol-grupo',
  tags: ['Historial Rol Grupo'],
  summary: 'Obtener historial de cambios de rol con filtro opcional por miembro_grupo_id',
  request: {
    query: ListHistorialRolGrupoQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(HistorialRolGrupoSchema), 'Success'),
});
historialRolGrupoRouter.get(
  '/',
  validateRequest(ListHistorialRolGrupoQuerySchema),
  historialRolGrupoController.getAll
);

// GET /api/historial-rol-grupo/:id - Obtener uno por ID
historialRolGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/historial-rol-grupo/{id}',
  tags: ['Historial Rol Grupo'],
  summary: 'Obtener un registro de historial por ID',
  request: { params: GetHistorialRolGrupoSchema.shape.params },
  responses: createApiResponse(HistorialRolGrupoSchema, 'Success'),
});
historialRolGrupoRouter.get(
  '/:id',
  validateRequest(GetHistorialRolGrupoSchema),
  historialRolGrupoController.getById
);

// POST /api/historial-rol-grupo - Registrar cambio de rol
historialRolGrupoRegistry.registerPath({
  method: 'post',
  path: '/api/historial-rol-grupo',
  tags: ['Historial Rol Grupo'],
  summary: 'Registrar un cambio de rol (actualiza automáticamente la membresía)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateHistorialRolGrupoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(HistorialRolGrupoSchema, 'Success'),
});
historialRolGrupoRouter.post(
  '/',
  validateRequest(CreateHistorialRolGrupoSchema),
  historialRolGrupoController.create
);
