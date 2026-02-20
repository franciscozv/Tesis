import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { tiposActividadController } from './tiposActividadController';
import {
  CreateTipoActividadSchema,
  GetTipoActividadSchema,
  TipoActividadSchema,
  ToggleEstadoTipoActividadSchema,
  UpdateTipoActividadSchema,
} from './tiposActividadModel';

export const tiposActividadRegistry = new OpenAPIRegistry();
export const tiposActividadRouter: Router = express.Router();

// Registrar schema en OpenAPI
tiposActividadRegistry.register('TipoActividad', TipoActividadSchema);

// Todas las rutas requieren autenticación
tiposActividadRouter.use(verificarToken);

// GET /api/tipos-actividad - Listar todos los tipos activos
tiposActividadRegistry.registerPath({
  method: 'get',
  path: '/api/tipos-actividad',
  tags: ['Tipos de Actividad'],
  summary: 'Obtener todos los tipos de actividad activos',
  responses: createApiResponse(z.array(TipoActividadSchema), 'Success'),
});
tiposActividadRouter.get('/', tiposActividadController.getAll);

// GET /api/tipos-actividad/:id - Obtener un tipo por ID
tiposActividadRegistry.registerPath({
  method: 'get',
  path: '/api/tipos-actividad/{id}',
  tags: ['Tipos de Actividad'],
  summary: 'Obtener un tipo de actividad por ID',
  request: { params: GetTipoActividadSchema.shape.params },
  responses: createApiResponse(TipoActividadSchema, 'Success'),
});
tiposActividadRouter.get(
  '/:id',
  validateRequest(GetTipoActividadSchema),
  tiposActividadController.getById
);

// POST /api/tipos-actividad - Crear un nuevo tipo
tiposActividadRegistry.registerPath({
  method: 'post',
  path: '/api/tipos-actividad',
  tags: ['Tipos de Actividad'],
  summary: 'Crear un nuevo tipo de actividad',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTipoActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TipoActividadSchema, 'Success'),
});
tiposActividadRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateTipoActividadSchema),
  tiposActividadController.create
);

// PUT /api/tipos-actividad/:id - Actualizar un tipo
tiposActividadRegistry.registerPath({
  method: 'put',
  path: '/api/tipos-actividad/{id}',
  tags: ['Tipos de Actividad'],
  summary: 'Actualizar un tipo de actividad',
  request: {
    params: UpdateTipoActividadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateTipoActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TipoActividadSchema, 'Success'),
});
tiposActividadRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdateTipoActividadSchema),
  tiposActividadController.update
);

// PATCH /api/tipos-actividad/:id/toggle-estado - Cambiar estado activo/inactivo
tiposActividadRegistry.registerPath({
  method: 'patch',
  path: '/api/tipos-actividad/{id}/toggle-estado',
  tags: ['Tipos de Actividad'],
  summary: 'Cambiar estado activo/inactivo de un tipo de actividad',
  request: { params: ToggleEstadoTipoActividadSchema.shape.params },
  responses: createApiResponse(TipoActividadSchema, 'Estado cambiado exitosamente'),
});
tiposActividadRouter.patch(
  '/:id/toggle-estado',
  verificarRol('administrador'),
  validateRequest(ToggleEstadoTipoActividadSchema),
  tiposActividadController.toggleEstado
);

// DELETE /api/tipos-actividad/:id - Eliminar un tipo (soft delete)
tiposActividadRegistry.registerPath({
  method: 'delete',
  path: '/api/tipos-actividad/{id}',
  tags: ['Tipos de Actividad'],
  summary: 'Eliminar un tipo de actividad (soft delete)',
  request: { params: GetTipoActividadSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
tiposActividadRouter.delete(
  '/:id',
  verificarRol('administrador'),
  validateRequest(GetTipoActividadSchema),
  tiposActividadController.delete
);
