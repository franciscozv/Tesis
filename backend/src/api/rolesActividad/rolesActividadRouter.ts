import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { responsabilidadesActividadController } from './rolesActividadController';
import {
  CreateResponsabilidadActividadSchema,
  GetResponsabilidadActividadSchema,
  ResponsabilidadActividadSchema,
  ToggleEstadoResponsabilidadActividadSchema,
  UpdateResponsabilidadActividadSchema,
} from './rolesActividadModel';

export const responsabilidadesActividadRegistry = new OpenAPIRegistry();
export const responsabilidadesActividadRouter: Router = express.Router();

// Registrar schema en OpenAPI
responsabilidadesActividadRegistry.register('ResponsabilidadActividad', ResponsabilidadActividadSchema);

// Todas las rutas requieren autenticación
responsabilidadesActividadRouter.use(verificarToken);

// GET /api/responsabilidades-actividad - Listar todos los roles activos
responsabilidadesActividadRegistry.registerPath({
  method: 'get',
  path: '/api/responsabilidades-actividad',
  tags: ['Responsabilidades de Actividad'],
  summary: 'Obtener todos los responsabilidades de actividad activos',
  responses: createApiResponse(z.array(ResponsabilidadActividadSchema), 'Success'),
});
responsabilidadesActividadRouter.get('/', responsabilidadesActividadController.getAll);

// GET /api/responsabilidades-actividad/:id - Obtener un rol por ID
responsabilidadesActividadRegistry.registerPath({
  method: 'get',
  path: '/api/responsabilidades-actividad/{id}',
  tags: ['Responsabilidades de Actividad'],
  summary: 'Obtener un responsabilidad de actividad por ID',
  request: { params: GetResponsabilidadActividadSchema.shape.params },
  responses: createApiResponse(ResponsabilidadActividadSchema, 'Success'),
});
responsabilidadesActividadRouter.get(
  '/:id',
  validateRequest(GetResponsabilidadActividadSchema),
  responsabilidadesActividadController.getById,
);

// POST /api/responsabilidades-actividad - Crear un nuevo rol
responsabilidadesActividadRegistry.registerPath({
  method: 'post',
  path: '/api/responsabilidades-actividad',
  tags: ['Responsabilidades de Actividad'],
  summary: 'Crear un nuevo responsabilidad de actividad',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateResponsabilidadActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ResponsabilidadActividadSchema, 'Success'),
});
responsabilidadesActividadRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateResponsabilidadActividadSchema),
  responsabilidadesActividadController.create,
);

// PUT /api/responsabilidades-actividad/:id - Actualizar un rol
responsabilidadesActividadRegistry.registerPath({
  method: 'put',
  path: '/api/responsabilidades-actividad/{id}',
  tags: ['Responsabilidades de Actividad'],
  summary: 'Actualizar un responsabilidad de actividad',
  request: {
    params: UpdateResponsabilidadActividadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateResponsabilidadActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ResponsabilidadActividadSchema, 'Success'),
});
responsabilidadesActividadRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdateResponsabilidadActividadSchema),
  responsabilidadesActividadController.update,
);

// PATCH /api/responsabilidades-actividad/:id/toggle-estado - Cambiar estado activo/inactivo
responsabilidadesActividadRegistry.registerPath({
  method: 'patch',
  path: '/api/responsabilidades-actividad/{id}/toggle-estado',
  tags: ['Responsabilidades de Actividad'],
  summary: 'Cambiar estado activo/inactivo de un responsabilidad de actividad',
  request: { params: ToggleEstadoResponsabilidadActividadSchema.shape.params },
  responses: createApiResponse(ResponsabilidadActividadSchema, 'Estado cambiado exitosamente'),
});
responsabilidadesActividadRouter.patch(
  '/:id/toggle-estado',
  verificarRol('administrador'),
  validateRequest(ToggleEstadoResponsabilidadActividadSchema),
  responsabilidadesActividadController.toggleEstado,
);

// DELETE /api/responsabilidades-actividad/:id - Eliminar un rol (soft delete)
responsabilidadesActividadRegistry.registerPath({
  method: 'delete',
  path: '/api/responsabilidades-actividad/{id}',
  tags: ['Responsabilidades de Actividad'],
  summary: 'Eliminar un responsabilidad de actividad (soft delete)',
  request: { params: GetResponsabilidadActividadSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
responsabilidadesActividadRouter.delete(
  '/:id',
  verificarRol('administrador'),
  validateRequest(GetResponsabilidadActividadSchema),
  responsabilidadesActividadController.delete,
);


