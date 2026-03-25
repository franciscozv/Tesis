import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { miembrosController } from '@/api/miembros/miembrosController';
import {
  ChangeEstadoComunionSchema,
  CreateMiembroSchema,
  EstadoComunionEnum,
  GetMiembroSchema,
  GetMiembrosQuerySchema,
  MiembroSchema,
  ResetPasswordMiembroSchema,
  UpdateCuentaSchema,
  UpdateMiembroSchema,
  UpdateMiPerfilSchema,
} from '@/api/miembros/miembrosModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';

export const miembrosRegistry = new OpenAPIRegistry();
export const miembrosRouter: Router = express.Router();

// Registrar schema principal
miembrosRegistry.register('Miembro', MiembroSchema);

// Todas las rutas requieren autenticación
miembrosRouter.use(verificarToken);

/**
 * PATCH /api/miembros/mi-perfil - Actualiza datos de contacto del perfil propio
 */
miembrosRegistry.registerPath({
  method: 'patch',
  path: '/api/miembros/mi-perfil',
  tags: ['Miembros'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateMiPerfilSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'Perfil actualizado exitosamente'),
});
miembrosRouter.patch(
  '/mi-perfil',
  validateRequest(UpdateMiPerfilSchema),
  miembrosController.updateMiPerfil,
);

/**
 * GET /api/miembros - Obtiene miembros paginados con búsqueda y filtros
 */
miembrosRegistry.registerPath({
  method: 'get',
  path: '/api/miembros',
  tags: ['Miembros'],
  request: {
    query: GetMiembrosQuerySchema.shape.query,
  },
  responses: createApiResponse(
    z.object({
      data: z.array(MiembroSchema),
      meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      }),
    }),
    'Success',
  ),
});
miembrosRouter.get('/', validateRequest(GetMiembrosQuerySchema), miembrosController.getAll);

/**
 * GET /api/miembros/:id - Obtiene un miembro por ID
 */
miembrosRegistry.registerPath({
  method: 'get',
  path: '/api/miembros/{id}',
  tags: ['Miembros'],
  request: { params: GetMiembroSchema.shape.params },
  responses: createApiResponse(MiembroSchema, 'Success'),
});
miembrosRouter.get('/:id', validateRequest(GetMiembroSchema), miembrosController.getById);

/**
 * POST /api/miembros - Crea un nuevo miembro (RF_01: Registrar nuevo miembro)
 */
miembrosRegistry.registerPath({
  method: 'post',
  path: '/api/miembros',
  tags: ['Miembros'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'Miembro creado exitosamente', 201),
});
miembrosRouter.post(
  '/',
  verificarRol('administrador'),
  validateRequest(CreateMiembroSchema),
  miembrosController.create,
);

/**
 * PUT /api/miembros/:id - Actualiza un miembro existente (RF_03: Actualizar información)
 */
miembrosRegistry.registerPath({
  method: 'put',
  path: '/api/miembros/{id}',
  tags: ['Miembros'],
  request: {
    params: UpdateMiembroSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'Miembro actualizado exitosamente'),
});
miembrosRouter.put(
  '/:id',
  verificarRol('administrador'),
  validateRequest(UpdateMiembroSchema),
  miembrosController.update,
);

/**
 * DELETE /api/miembros/:id - Elimina lógicamente un miembro (soft delete)
 */
miembrosRegistry.registerPath({
  method: 'delete',
  path: '/api/miembros/{id}',
  tags: ['Miembros'],
  request: { params: GetMiembroSchema.shape.params },
  responses: createApiResponse(z.null(), 'Miembro eliminado exitosamente'),
});
miembrosRouter.delete(
  '/:id',
  verificarRol('administrador'),
  validateRequest(GetMiembroSchema),
  miembrosController.delete,
);

/**
 * PATCH /api/miembros/:id/reactivar - Reactiva un miembro inactivo
 */
miembrosRegistry.registerPath({
  method: 'patch',
  path: '/api/miembros/{id}/reactivar',
  tags: ['Miembros'],
  request: { params: GetMiembroSchema.shape.params },
  responses: createApiResponse(MiembroSchema, 'Miembro reactivado exitosamente'),
});
miembrosRouter.patch(
  '/:id/reactivar',
  verificarRol('administrador'),
  validateRequest(GetMiembroSchema),
  miembrosController.reactivar,
);

/**
 * PATCH /api/miembros/:id/estado - Cambia el estado de membresía (RF_05)
 */
miembrosRegistry.registerPath({
  method: 'patch',
  path: '/api/miembros/{id}/estado',
  tags: ['Miembros'],
  request: {
    params: ChangeEstadoComunionSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: ChangeEstadoComunionSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'Estado de membresía actualizado exitosamente'),
});
miembrosRouter.patch(
  '/:id/estado',
  verificarRol('administrador'),
  validateRequest(ChangeEstadoComunionSchema),
  miembrosController.changeEstadoComunion,
);

/**
 * PUT /api/miembros/:id/cuenta - Actualiza cuenta de acceso de un miembro
 */
miembrosRegistry.registerPath({
  method: 'put',
  path: '/api/miembros/{id}/cuenta',
  tags: ['Miembros'],
  summary: 'Actualizar email y/o rol de la cuenta de un miembro',
  request: {
    params: UpdateCuentaSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdateCuentaSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'Cuenta actualizada exitosamente'),
});
miembrosRouter.put(
  '/:id/cuenta',
  verificarRol('administrador'),
  validateRequest(UpdateCuentaSchema),
  miembrosController.actualizarCuenta,
);

/**
 * PATCH /api/miembros/:id/password - Restablece contraseÃ±a de un miembro
 */
miembrosRegistry.registerPath({
  method: 'patch',
  path: '/api/miembros/{id}/password',
  tags: ['Miembros'],
  summary: 'Restablecer contraseÃ±a de un miembro',
  request: {
    params: ResetPasswordMiembroSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: ResetPasswordMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'ContraseÃ±a restablecida exitosamente'),
});
miembrosRouter.patch(
  '/:id/password',
  verificarRol('administrador'),
  validateRequest(ResetPasswordMiembroSchema),
  miembrosController.resetPassword,
);
