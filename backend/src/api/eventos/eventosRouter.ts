import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { eventosController } from './eventosController';
import {
  AprobarEventoSchema,
  CambiarEstadoEventoSchema,
  CreateEventoSchema,
  EventoConIglesiasSchema,
  EventoSchema,
  GetEventoSchema,
  RechazarEventoSchema,
} from './eventosModel';

export const eventosRegistry = new OpenAPIRegistry();
export const eventosRouter: Router = express.Router();

eventosRegistry.register('Evento', EventoSchema);
eventosRegistry.register('EventoConIglesias', EventoConIglesiasSchema);

// GET /api/eventos - Listar todos los eventos activos
eventosRegistry.registerPath({
  method: 'get',
  path: '/api/eventos',
  tags: ['Eventos'],
  responses: createApiResponse(z.array(EventoSchema), 'Success'),
});
eventosRouter.get('/', eventosController.getAll);

// GET /api/eventos/:id - Obtener un evento por ID (con iglesias invitadas)
eventosRegistry.registerPath({
  method: 'get',
  path: '/api/eventos/{id}',
  tags: ['Eventos'],
  request: { params: GetEventoSchema.shape.params },
  responses: createApiResponse(EventoConIglesiasSchema, 'Success'),
});
eventosRouter.get('/:id', validateRequest(GetEventoSchema), eventosController.getById);

// POST /api/eventos - Crear/Solicitar un nuevo evento (RF_08)
eventosRegistry.registerPath({
  method: 'post',
  path: '/api/eventos',
  tags: ['Eventos'],
  request: {
    body: { content: { 'application/json': { schema: CreateEventoSchema.shape.body } } },
  },
  responses: createApiResponse(EventoSchema, 'Success'),
});
eventosRouter.post('/', validateRequest(CreateEventoSchema), eventosController.create);

// PATCH /api/eventos/:id/aprobar - Aprobar un evento
eventosRegistry.registerPath({
  method: 'patch',
  path: '/api/eventos/{id}/aprobar',
  tags: ['Eventos'],
  request: {
    params: AprobarEventoSchema.shape.params,
    body: { content: { 'application/json': { schema: AprobarEventoSchema.shape.body } } },
  },
  responses: createApiResponse(EventoSchema, 'Success'),
});
eventosRouter.patch(
  '/:id/aprobar',
  validateRequest(AprobarEventoSchema),
  eventosController.aprobar
);

// PATCH /api/eventos/:id/rechazar - Rechazar un evento
eventosRegistry.registerPath({
  method: 'patch',
  path: '/api/eventos/{id}/rechazar',
  tags: ['Eventos'],
  request: {
    params: RechazarEventoSchema.shape.params,
    body: { content: { 'application/json': { schema: RechazarEventoSchema.shape.body } } },
  },
  responses: createApiResponse(EventoSchema, 'Success'),
});
eventosRouter.patch(
  '/:id/rechazar',
  validateRequest(RechazarEventoSchema),
  eventosController.rechazar
);

// PATCH /api/eventos/:id/estado - Cambiar el estado de un evento
eventosRegistry.registerPath({
  method: 'patch',
  path: '/api/eventos/{id}/estado',
  tags: ['Eventos'],
  request: {
    params: CambiarEstadoEventoSchema.shape.params,
    body: { content: { 'application/json': { schema: CambiarEstadoEventoSchema.shape.body } } },
  },
  responses: createApiResponse(EventoSchema, 'Success'),
});
eventosRouter.patch(
  '/:id/estado',
  validateRequest(CambiarEstadoEventoSchema),
  eventosController.cambiarEstado
);

// DELETE /api/eventos/:id - Eliminar un evento (soft delete)
eventosRegistry.registerPath({
  method: 'delete',
  path: '/api/eventos/{id}',
  tags: ['Eventos'],
  request: { params: GetEventoSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
eventosRouter.delete('/:id', validateRequest(GetEventoSchema), eventosController.delete);
