import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { miembrosController } from '@/api/miembros/miembrosController';
import {
  ChangeEstadoMembresiaSchema,
  CreateMiembroSchema,
  GetMiembroSchema,
  MiembroSchema,
  UpdateMiembroSchema,
} from '@/api/miembros/miembrosModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';

export const miembrosRegistry = new OpenAPIRegistry();
export const miembrosRouter: Router = express.Router();

// Registrar schema principal
miembrosRegistry.register('Miembro', MiembroSchema);

/**
 * GET /api/miembros - Obtiene todos los miembros activos
 */
miembrosRegistry.registerPath({
  method: 'get',
  path: '/api/miembros',
  tags: ['Miembros'],
  responses: createApiResponse(z.array(MiembroSchema), 'Success'),
});
miembrosRouter.get('/', miembrosController.getAll);

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
miembrosRouter.post('/', validateRequest(CreateMiembroSchema), miembrosController.create);

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
miembrosRouter.put('/:id', validateRequest(UpdateMiembroSchema), miembrosController.update);

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
miembrosRouter.delete('/:id', validateRequest(GetMiembroSchema), miembrosController.delete);

/**
 * PATCH /api/miembros/:id/estado - Cambia el estado de membresía (RF_05)
 */
miembrosRegistry.registerPath({
  method: 'patch',
  path: '/api/miembros/{id}/estado',
  tags: ['Miembros'],
  request: {
    params: ChangeEstadoMembresiaSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: ChangeEstadoMembresiaSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MiembroSchema, 'Estado de membresía actualizado exitosamente'),
});
miembrosRouter.patch(
  '/:id/estado',
  validateRequest(ChangeEstadoMembresiaSchema),
  miembrosController.changeEstadoMembresia,
);
