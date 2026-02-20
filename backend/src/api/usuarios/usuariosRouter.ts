import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { usuariosController } from './usuariosController';
import {
  CreateUsuarioSchema,
  GetUsuarioSchema,
  PatchEstadoUsuarioSchema,
  UpdateUsuarioSchema,
  UsuarioSchema,
} from './usuariosModel';

export const usuariosRegistry = new OpenAPIRegistry();
export const usuariosRouter: Router = express.Router();

// Registrar schema en OpenAPI
usuariosRegistry.register('Usuario', UsuarioSchema);

// Todas las rutas de usuarios requieren autenticación + rol administrador
usuariosRouter.use(verificarToken, verificarRol('administrador'));

// GET /api/usuarios - Listar todos los usuarios
usuariosRegistry.registerPath({
  method: 'get',
  path: '/api/usuarios',
  tags: ['Usuarios'],
  summary: 'Obtener todos los usuarios',
  responses: createApiResponse(z.array(UsuarioSchema), 'Success'),
});
usuariosRouter.get('/', usuariosController.getAll);

// GET /api/usuarios/:id - Obtener un usuario por ID
usuariosRegistry.registerPath({
  method: 'get',
  path: '/api/usuarios/{id}',
  tags: ['Usuarios'],
  summary: 'Obtener un usuario por ID',
  request: { params: GetUsuarioSchema.shape.params },
  responses: createApiResponse(UsuarioSchema, 'Success'),
});
usuariosRouter.get(
  '/:id',
  validateRequest(GetUsuarioSchema),
  usuariosController.getById
);

// POST /api/usuarios - Crear un nuevo usuario
usuariosRegistry.registerPath({
  method: 'post',
  path: '/api/usuarios',
  tags: ['Usuarios'],
  summary: 'Crear un nuevo usuario (password se hashea con bcrypt)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUsuarioSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UsuarioSchema, 'Success'),
});
usuariosRouter.post(
  '/',
  validateRequest(CreateUsuarioSchema),
  usuariosController.create
);

// PUT /api/usuarios/:id - Actualizar un usuario (email y/o rol)
usuariosRegistry.registerPath({
  method: 'put',
  path: '/api/usuarios/{id}',
  tags: ['Usuarios'],
  summary: 'Actualizar email y/o rol de un usuario',
  request: {
    params: UpdateUsuarioSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateUsuarioSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UsuarioSchema, 'Success'),
});
usuariosRouter.put(
  '/:id',
  validateRequest(UpdateUsuarioSchema),
  usuariosController.update
);

// PATCH /api/usuarios/:id/estado - Activar/desactivar un usuario
usuariosRegistry.registerPath({
  method: 'patch',
  path: '/api/usuarios/{id}/estado',
  tags: ['Usuarios'],
  summary: 'Activar o desactivar un usuario',
  request: {
    params: PatchEstadoUsuarioSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchEstadoUsuarioSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UsuarioSchema, 'Success'),
});
usuariosRouter.patch(
  '/:id/estado',
  validateRequest(PatchEstadoUsuarioSchema),
  usuariosController.updateEstado
);
