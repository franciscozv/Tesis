import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { rolesActividadController } from './rolesActividadController';
import {
  CreateRolActividadSchema,
  GetRolActividadSchema,
  RolActividadSchema,
  ToggleEstadoRolActividadSchema,
  UpdateRolActividadSchema,
} from './rolesActividadModel';

export const rolesActividadRegistry = new OpenAPIRegistry();
export const rolesActividadRouter: Router = express.Router();

// Registrar schema en OpenAPI
rolesActividadRegistry.register('RolActividad', RolActividadSchema);

// Todas las rutas requieren autenticación
rolesActividadRouter.use(verificarToken);

// GET /api/roles-actividad - Listar todos los roles activos
rolesActividadRegistry.registerPath({
  method: 'get',
  path: '/api/roles-actividad',
  tags: ['Roles de Actividad'],
  summary: 'Obtener todos los roles de actividad activos',
  responses: createApiResponse(z.array(RolActividadSchema), 'Success'),
});
rolesActividadRouter.get('/', rolesActividadController.getAll);

// GET /api/roles-actividad/:id - Obtener un rol por ID
rolesActividadRegistry.registerPath({
  method: 'get',
  path: '/api/roles-actividad/{id}',
  tags: ['Roles de Actividad'],
  summary: 'Obtener un rol de actividad por ID',
  request: { params: GetRolActividadSchema.shape.params },
  responses: createApiResponse(RolActividadSchema, 'Success'),
});
rolesActividadRouter.get('/:id', validateRequest(GetRolActividadSchema), rolesActividadController.getById);

// POST /api/roles-actividad - Crear un nuevo rol
rolesActividadRegistry.registerPath({
  method: 'post',
  path: '/api/roles-actividad',
  tags: ['Roles de Actividad'],
  summary: 'Crear un nuevo rol de actividad',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateRolActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(RolActividadSchema, 'Success'),
});
rolesActividadRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateRolActividadSchema),
  rolesActividadController.create
);

// PUT /api/roles-actividad/:id - Actualizar un rol
rolesActividadRegistry.registerPath({
  method: 'put',
  path: '/api/roles-actividad/{id}',
  tags: ['Roles de Actividad'],
  summary: 'Actualizar un rol de actividad',
  request: {
    params: UpdateRolActividadSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateRolActividadSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(RolActividadSchema, 'Success'),
});
rolesActividadRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdateRolActividadSchema),
  rolesActividadController.update
);

// PATCH /api/roles-actividad/:id/toggle-estado - Cambiar estado activo/inactivo
rolesActividadRegistry.registerPath({
  method: 'patch',
  path: '/api/roles-actividad/{id}/toggle-estado',
  tags: ['Roles de Actividad'],
  summary: 'Cambiar estado activo/inactivo de un rol de actividad',
  request: { params: ToggleEstadoRolActividadSchema.shape.params },
  responses: createApiResponse(RolActividadSchema, 'Estado cambiado exitosamente'),
});
rolesActividadRouter.patch(
  '/:id/toggle-estado',
  verificarRol('administrador'),
  validateRequest(ToggleEstadoRolActividadSchema),
  rolesActividadController.toggleEstado
);

// DELETE /api/roles-actividad/:id - Eliminar un rol (soft delete)
rolesActividadRegistry.registerPath({
  method: 'delete',
  path: '/api/roles-actividad/{id}',
  tags: ['Roles de Actividad'],
  summary: 'Eliminar un rol de actividad (soft delete)',
  request: { params: GetRolActividadSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
rolesActividadRouter.delete(
  '/:id',
  verificarRol('administrador'),
  validateRequest(GetRolActividadSchema),
  rolesActividadController.delete
);
