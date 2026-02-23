import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { patronesActividadController } from './patronesActividadController';
import {
  CreatePatronActividadSchema,
  GenerarInstanciasResponseSchema,
  GenerarInstanciasSchema,
  GetPatronActividadSchema,
  PatchEstadoPatronSchema,
  PatronActividadSchema,
  UpdatePatronActividadSchema,
} from './patronesActividadModel';

export const patronesActividadRegistry = new OpenAPIRegistry();
export const patronesActividadRouter: Router = express.Router();

// Registrar schema en OpenAPI
patronesActividadRegistry.register('PatronActividad', PatronActividadSchema);

// Todas las rutas requieren autenticación
patronesActividadRouter.use(verificarToken);

// GET /api/patrones - Listar todos los patrones activos
patronesActividadRegistry.registerPath({
  method: 'get',
  path: '/api/patrones',
  tags: ['Patrones de Actividad'],
  summary: 'Obtener todos los patrones de actividad activos',
  responses: createApiResponse(z.array(PatronActividadSchema), 'Success'),
});
patronesActividadRouter.get('/', patronesActividadController.getAll);

// POST /api/patrones/generar-instancias - Generar actividades desde patrones (antes de /:id)
patronesActividadRegistry.registerPath({
  method: 'post',
  path: '/api/patrones/generar-instancias',
  tags: ['Patrones de Actividad'],
  summary:
    'Generar instancias de actividades a partir de todos los patrones activos para un mes/año',
  request: {
    body: {
      content: {
        'application/json': {
          schema: GenerarInstanciasSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(GenerarInstanciasResponseSchema, 'Success'),
});
patronesActividadRouter.post(
  '/generar-instancias',
  verificarRol('administrador'),
  validateRequest(GenerarInstanciasSchema),
  patronesActividadController.generarInstancias,
);

// GET /api/patrones/:id - Obtener un patrón por ID
patronesActividadRegistry.registerPath({
  method: 'get',
  path: '/api/patrones/{id}',
  tags: ['Patrones de Actividad'],
  summary: 'Obtener un patrón de actividad por ID',
  request: { params: GetPatronActividadSchema.shape.params },
  responses: createApiResponse(PatronActividadSchema, 'Success'),
});
patronesActividadRouter.get(
  '/:id',
  validateRequest(GetPatronActividadSchema),
  patronesActividadController.getById,
);

// POST /api/patrones - Crear un nuevo patrón
patronesActividadRegistry.registerPath({
  method: 'post',
  path: '/api/patrones',
  tags: ['Patrones de Actividad'],
  summary: 'Crear un nuevo patrón de actividad',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePatronActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PatronActividadSchema, 'Success'),
});
patronesActividadRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreatePatronActividadSchema),
  patronesActividadController.create,
);

// PUT /api/patrones/:id - Actualizar un patrón
patronesActividadRegistry.registerPath({
  method: 'put',
  path: '/api/patrones/{id}',
  tags: ['Patrones de Actividad'],
  summary: 'Actualizar un patrón de actividad',
  request: {
    params: UpdatePatronActividadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdatePatronActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PatronActividadSchema, 'Success'),
});
patronesActividadRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdatePatronActividadSchema),
  patronesActividadController.update,
);

// PATCH /api/patrones/:id/estado - Activar/desactivar un patrón
patronesActividadRegistry.registerPath({
  method: 'patch',
  path: '/api/patrones/{id}/estado',
  tags: ['Patrones de Actividad'],
  summary: 'Activar o desactivar un patrón de actividad',
  request: {
    params: PatchEstadoPatronSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchEstadoPatronSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PatronActividadSchema, 'Success'),
});
patronesActividadRouter.patch(
  '/:id/estado',
  verificarRol('administrador'),
  validateRequest(PatchEstadoPatronSchema),
  patronesActividadController.updateEstado,
);
