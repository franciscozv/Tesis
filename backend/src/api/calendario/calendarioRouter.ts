import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { calendarioController } from './calendarioController';
import {
  CalendarioEventoSchema,
  CalendarioQuerySchema,
  MisResponsabilidadesSchema,
  ResponsabilidadSchema,
} from './calendarioModel';

export const calendarioRegistry = new OpenAPIRegistry();
export const calendarioRouter: Router = express.Router();

// Registrar schemas en OpenAPI
calendarioRegistry.register('CalendarioEvento', CalendarioEventoSchema);
calendarioRegistry.register('Responsabilidad', ResponsabilidadSchema);

// GET /api/calendario/publico - Calendario público (sin autenticación)
calendarioRegistry.registerPath({
  method: 'get',
  path: '/api/calendario/publico',
  tags: ['Calendario'],
  summary: 'Obtener calendario público de actividades para un mes/año',
  request: {
    query: CalendarioQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(CalendarioEventoSchema), 'Success'),
});
calendarioRouter.get(
  '/publico',
  validateRequest(CalendarioQuerySchema),
  calendarioController.getPublico
);

// GET /api/calendario/consolidado - Calendario consolidado (requiere autenticación)
calendarioRegistry.registerPath({
  method: 'get',
  path: '/api/calendario/consolidado',
  tags: ['Calendario'],
  summary: 'Obtener calendario consolidado con todas las actividades programadas del mes/año',
  request: {
    query: CalendarioQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(CalendarioEventoSchema), 'Success'),
});
calendarioRouter.get(
  '/consolidado',
  verificarToken,
  validateRequest(CalendarioQuerySchema),
  calendarioController.getConsolidado
);

// GET /api/calendario/mis-responsabilidades/:miembro_id - Responsabilidades del miembro
calendarioRegistry.registerPath({
  method: 'get',
  path: '/api/calendario/mis-responsabilidades/{miembro_id}',
  tags: ['Calendario'],
  summary:
    'Obtener responsabilidades futuras confirmadas de un miembro (validación de pertenencia por token)',
  request: {
    params: MisResponsabilidadesSchema.shape.params,
  },
  responses: createApiResponse(z.array(ResponsabilidadSchema), 'Success'),
});
calendarioRouter.get(
  '/mis-responsabilidades/:miembro_id',
  verificarToken,
  validateRequest(MisResponsabilidadesSchema),
  calendarioController.getMisResponsabilidades
);
