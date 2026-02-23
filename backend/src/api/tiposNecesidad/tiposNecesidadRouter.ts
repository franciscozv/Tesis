import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { tiposNecesidadController } from './tiposNecesidadController';
import {
  CreateTipoNecesidadSchema,
  GetTipoNecesidadSchema,
  TipoNecesidadSchema,
  ToggleEstadoTipoNecesidadSchema,
  UpdateTipoNecesidadSchema,
} from './tiposNecesidadModel';

export const tiposNecesidadRegistry = new OpenAPIRegistry();
export const tiposNecesidadRouter: Router = express.Router();

// Registrar schema en OpenAPI
tiposNecesidadRegistry.register('TipoNecesidad', TipoNecesidadSchema);

// Todas las rutas requieren autenticación
tiposNecesidadRouter.use(verificarToken);

// GET /api/tipos-necesidad - Listar todos los tipos activos
tiposNecesidadRegistry.registerPath({
  method: 'get',
  path: '/api/tipos-necesidad',
  tags: ['Tipos de Necesidad Logística'],
  summary: 'Obtener todos los tipos de necesidad activos',
  responses: createApiResponse(z.array(TipoNecesidadSchema), 'Success'),
});
tiposNecesidadRouter.get('/', tiposNecesidadController.getAll);

// GET /api/tipos-necesidad/:id - Obtener un tipo por ID
tiposNecesidadRegistry.registerPath({
  method: 'get',
  path: '/api/tipos-necesidad/{id}',
  tags: ['Tipos de Necesidad Logística'],
  summary: 'Obtener un tipo de necesidad por ID',
  request: { params: GetTipoNecesidadSchema.shape.params },
  responses: createApiResponse(TipoNecesidadSchema, 'Success'),
});
tiposNecesidadRouter.get(
  '/:id',
  validateRequest(GetTipoNecesidadSchema),
  tiposNecesidadController.getById,
);

// POST /api/tipos-necesidad - Crear un nuevo tipo
tiposNecesidadRegistry.registerPath({
  method: 'post',
  path: '/api/tipos-necesidad',
  tags: ['Tipos de Necesidad Logística'],
  summary: 'Crear un nuevo tipo de necesidad',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTipoNecesidadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TipoNecesidadSchema, 'Success'),
});
tiposNecesidadRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateTipoNecesidadSchema),
  tiposNecesidadController.create,
);

// PUT /api/tipos-necesidad/:id - Actualizar un tipo
tiposNecesidadRegistry.registerPath({
  method: 'put',
  path: '/api/tipos-necesidad/{id}',
  tags: ['Tipos de Necesidad Logística'],
  summary: 'Actualizar un tipo de necesidad',
  request: {
    params: UpdateTipoNecesidadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateTipoNecesidadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TipoNecesidadSchema, 'Success'),
});
tiposNecesidadRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdateTipoNecesidadSchema),
  tiposNecesidadController.update,
);

// PATCH /api/tipos-necesidad/:id/toggle-estado - Cambiar estado activo/inactivo
tiposNecesidadRegistry.registerPath({
  method: 'patch',
  path: '/api/tipos-necesidad/{id}/toggle-estado',
  tags: ['Tipos de Necesidad Logística'],
  summary: 'Cambiar estado activo/inactivo de un tipo de necesidad',
  request: { params: ToggleEstadoTipoNecesidadSchema.shape.params },
  responses: createApiResponse(TipoNecesidadSchema, 'Estado cambiado exitosamente'),
});
tiposNecesidadRouter.patch(
  '/:id/toggle-estado',
  verificarRol('administrador'),
  validateRequest(ToggleEstadoTipoNecesidadSchema),
  tiposNecesidadController.toggleEstado,
);

// DELETE /api/tipos-necesidad/:id - Eliminar un tipo (soft delete)
tiposNecesidadRegistry.registerPath({
  method: 'delete',
  path: '/api/tipos-necesidad/{id}',
  tags: ['Tipos de Necesidad Logística'],
  summary: 'Eliminar un tipo de necesidad (soft delete)',
  request: { params: GetTipoNecesidadSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
tiposNecesidadRouter.delete(
  '/:id',
  verificarRol('administrador'),
  validateRequest(GetTipoNecesidadSchema),
  tiposNecesidadController.delete,
);
