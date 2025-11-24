import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { membresiaGrupoController } from './membresiaGrupoController';
import {
  DesvincularMiembroSchema,
  GetMembresiasByGrupoSchema,
  GetMembresiasByMiembroSchema,
  MembresiaGrupoSchema,
  VincularMiembroSchema,
} from './membresiaGrupoModel';

export const membresiaGrupoRegistry = new OpenAPIRegistry();
export const membresiaGrupoRouter: Router = express.Router();

// Registrar schema principal
membresiaGrupoRegistry.register('MembresiaGrupo', MembresiaGrupoSchema);

/**
 * POST /api/membresia-grupo - Vincular miembro a grupo (RF_06)
 */
membresiaGrupoRegistry.registerPath({
  method: 'post',
  path: '/api/membresia-grupo',
  tags: ['Membresía en Grupos'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VincularMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MembresiaGrupoSchema, 'Miembro vinculado exitosamente'),
});
membresiaGrupoRouter.post(
  '/',
  validateRequest(VincularMiembroSchema),
  membresiaGrupoController.vincularMiembro,
);

/**
 * PATCH /api/membresia-grupo/:id/desvincular - Desvincular miembro (RF_07)
 */
membresiaGrupoRegistry.registerPath({
  method: 'patch',
  path: '/api/membresia-grupo/{id}/desvincular',
  tags: ['Membresía en Grupos'],
  request: {
    params: DesvincularMiembroSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: DesvincularMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MembresiaGrupoSchema, 'Miembro desvinculado exitosamente'),
});
membresiaGrupoRouter.patch(
  '/:id/desvincular',
  validateRequest(DesvincularMiembroSchema),
  membresiaGrupoController.desvincularMiembro,
);

/**
 * GET /api/membresia-grupo/miembro/:miembro_id - Obtener grupos de un miembro
 */
membresiaGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/membresia-grupo/miembro/{miembro_id}',
  tags: ['Membresía en Grupos'],
  request: {
    params: GetMembresiasByMiembroSchema.shape.params,
  },
  responses: createApiResponse(z.array(MembresiaGrupoSchema), 'Membresías encontradas'),
});
membresiaGrupoRouter.get(
  '/miembro/:miembro_id',
  validateRequest(GetMembresiasByMiembroSchema),
  membresiaGrupoController.getMembresiasByMiembro,
);

/**
 * GET /api/membresia-grupo/grupo/:grupo_id - Obtener miembros de un grupo
 */
membresiaGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/membresia-grupo/grupo/{grupo_id}',
  tags: ['Membresía en Grupos'],
  request: {
    params: GetMembresiasByGrupoSchema.shape.params,
  },
  responses: createApiResponse(z.array(MembresiaGrupoSchema), 'Miembros del grupo encontrados'),
});
membresiaGrupoRouter.get(
  '/grupo/:grupo_id',
  validateRequest(GetMembresiasByGrupoSchema),
  membresiaGrupoController.getMembresiasByGrupo,
);
