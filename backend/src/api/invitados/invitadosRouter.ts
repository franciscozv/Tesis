import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { invitadosController } from './invitadosController';
import {
  CreateInvitadoSchema,
  GetInvitadoSchema,
  InvitadoSchema,
  ListInvitadosQuerySchema,
  PatchAsistenciaInvitadoSchema,
  PatchResponderInvitadoSchema,
} from './invitadosModel';

export const invitadosRegistry = new OpenAPIRegistry();
export const invitadosRouter: Router = express.Router();

// Registrar schema en OpenAPI
invitadosRegistry.register('Invitado', InvitadoSchema);

// Todas las rutas requieren autenticación
invitadosRouter.use(verificarToken);

// GET /api/invitados - Listar con filtros
invitadosRegistry.registerPath({
  method: 'get',
  path: '/api/invitados',
  tags: ['Invitados'],
  summary: 'Obtener invitados con filtros opcionales (actividad_id, miembro_id, estado)',
  request: {
    query: ListInvitadosQuerySchema.shape.query,
  },
  responses: createApiResponse(z.array(InvitadoSchema), 'Success'),
});
invitadosRouter.get('/', validateRequest(ListInvitadosQuerySchema), invitadosController.getAll);

// GET /api/invitados/:id - Obtener uno por ID
invitadosRegistry.registerPath({
  method: 'get',
  path: '/api/invitados/{id}',
  tags: ['Invitados'],
  summary: 'Obtener un invitado por ID',
  request: { params: GetInvitadoSchema.shape.params },
  responses: createApiResponse(InvitadoSchema, 'Success'),
});
invitadosRouter.get('/:id', validateRequest(GetInvitadoSchema), invitadosController.getById);

// POST /api/invitados - Crear invitación
invitadosRegistry.registerPath({
  method: 'post',
  path: '/api/invitados',
  tags: ['Invitados'],
  summary: 'Crear una nueva invitación para un miembro',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateInvitadoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(InvitadoSchema, 'Success'),
});
invitadosRouter.post(
  '/',
  verificarRol('administrador', 'lider'),
  validateRequest(CreateInvitadoSchema),
  invitadosController.create,
);

// PATCH /api/invitados/:id/responder - Confirmar o rechazar
invitadosRegistry.registerPath({
  method: 'patch',
  path: '/api/invitados/{id}/responder',
  tags: ['Invitados'],
  summary: 'Confirmar o rechazar una invitación (requiere motivo si rechaza)',
  request: {
    params: PatchResponderInvitadoSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchResponderInvitadoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(InvitadoSchema, 'Success'),
});
invitadosRouter.patch(
  '/:id/responder',
  validateRequest(PatchResponderInvitadoSchema),
  invitadosController.responder,
);

// PATCH /api/invitados/:id/asistencia - Marcar asistencia real
invitadosRegistry.registerPath({
  method: 'patch',
  path: '/api/invitados/{id}/asistencia',
  tags: ['Invitados'],
  summary: 'Marcar si el invitado asistió realmente a la actividad',
  request: {
    params: PatchAsistenciaInvitadoSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: PatchAsistenciaInvitadoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(InvitadoSchema, 'Success'),
});
invitadosRouter.patch(
  '/:id/asistencia',
  verificarRol('administrador', 'lider'),
  validateRequest(PatchAsistenciaInvitadoSchema),
  invitadosController.marcarAsistencia,
);

// DELETE /api/invitados/:id - Eliminar (solo si pendiente)
invitadosRegistry.registerPath({
  method: 'delete',
  path: '/api/invitados/{id}',
  tags: ['Invitados'],
  summary: 'Eliminar una invitación (solo si está pendiente)',
  request: { params: GetInvitadoSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
invitadosRouter.delete(
  '/:id',
  verificarRol('administrador', 'lider'),
  validateRequest(GetInvitadoSchema),
  invitadosController.delete,
);
