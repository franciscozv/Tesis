import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { historialEstadoController } from './historialEstadoController';
import {
  CreateHistorialEstadoSchema,
  GetHistorialEstadoSchema,
  HistorialEstadoConUsuarioSchema,
  HistorialEstadoSchema,
  ListHistorialEstadoQuerySchema,
} from './historialEstadoModel';

export const historialEstadoRegistry = new OpenAPIRegistry();
export const historialEstadoRouter: Router = express.Router();

// Registrar schema en OpenAPI
historialEstadoRegistry.register('HistorialEstado', HistorialEstadoSchema);

// POST requiere administrador; GET permite también a usuarios directiva (verificado en service)
historialEstadoRouter.use(verificarToken);

// GET /api/historial-estado?miembro_id=X - Obtener historial por miembro con datos del usuario
historialEstadoRegistry.registerPath({
  method: 'get',
  path: '/api/historial-estado',
  tags: ['Historial Estado Membresía'],
  summary: 'Obtener historial de cambios de estado de un miembro (miembro_id obligatorio)',
  request: {
    query: ListHistorialEstadoQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(HistorialEstadoConUsuarioSchema), 'Success'),
});
historialEstadoRouter.get(
  '/',
  validateRequest(ListHistorialEstadoQuerySchema),
  historialEstadoController.getByMiembro,
);

// GET /api/historial-estado/:id - Obtener uno por ID
historialEstadoRegistry.registerPath({
  method: 'get',
  path: '/api/historial-estado/{id}',
  tags: ['Historial Estado Membresía'],
  summary: 'Obtener un registro de historial de estado por ID',
  request: { params: GetHistorialEstadoSchema.shape.params },
  responses: createApiResponse(HistorialEstadoSchema, 'Success'),
});
historialEstadoRouter.get(
  '/:id',
  validateRequest(GetHistorialEstadoSchema),
  historialEstadoController.getById,
);

// POST /api/historial-estado - Registrar cambio de estado
historialEstadoRegistry.registerPath({
  method: 'post',
  path: '/api/historial-estado',
  tags: ['Historial Estado Membresía'],
  summary: 'Registrar un cambio de estado (actualiza automáticamente el miembro)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateHistorialEstadoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(HistorialEstadoSchema, 'Success'),
});
historialEstadoRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateHistorialEstadoSchema),
  historialEstadoController.create,
);
