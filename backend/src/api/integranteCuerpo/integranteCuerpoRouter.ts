import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { integranteCuerpoController } from './integranteCuerpoController';
import {
  CambiarRolIntegranteSchema,
  DesvincularMiembroSchema,
  GetIntegrantesByGrupoSchema,
  GetIntegrantesByMiembroSchema,
  IntegranteCuerpoConNombresSchema,
  IntegranteCuerpoSchema,
  VincularMiembroSchema,
} from './integranteCuerpoModel';

export const integranteCuerpoRegistry = new OpenAPIRegistry();
export const integranteCuerpoRouter: Router = express.Router();

// Registrar schema principal
integranteCuerpoRegistry.register('IntegranteCuerpo', IntegranteCuerpoSchema);

// Todas las rutas requieren autenticación
integranteCuerpoRouter.use(verificarToken);

/**
 * POST /api/integrantes-cuerpo - Vincular miembro a grupo (RF_06)
 * Permisos: admin, lider
 */
integranteCuerpoRegistry.registerPath({
  method: 'post',
  path: '/api/integrantes-cuerpo',
  tags: ['Integrantes de Cuerpo'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VincularMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(IntegranteCuerpoSchema, 'Miembro vinculado exitosamente'),
});
integranteCuerpoRouter.post(
  '/',
  verificarRol('administrador', 'usuario'),
  validateRequest(VincularMiembroSchema),
  integranteCuerpoController.vincularMiembro,
);

/**
 * PATCH /api/integrantes-cuerpo/:id/desvincular - Desvincular miembro (RF_07)
 * Permisos: admin, secretario, lider
 */
integranteCuerpoRegistry.registerPath({
  method: 'patch',
  path: '/api/integrantes-cuerpo/{id}/desvincular',
  tags: ['Integrantes de Cuerpo'],
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
  responses: createApiResponse(IntegranteCuerpoSchema, 'Miembro desvinculado exitosamente'),
});
integranteCuerpoRouter.patch(
  '/:id/desvincular',
  verificarRol('administrador', 'usuario'),
  validateRequest(DesvincularMiembroSchema),
  integranteCuerpoController.desvincularMiembro,
);

/**
 * PATCH /api/integrantes-cuerpo/:id/cambiar-rol - Cambiar rol de una membresía activa
 * Permisos: admin, lider
 */
integranteCuerpoRegistry.registerPath({
  method: 'patch',
  path: '/api/integrantes-cuerpo/{id}/cambiar-rol',
  tags: ['Integrantes de Cuerpo'],
  request: {
    params: CambiarRolIntegranteSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: CambiarRolIntegranteSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(IntegranteCuerpoSchema, 'Rol cambiado exitosamente'),
});
integranteCuerpoRouter.patch(
  '/:id/cambiar-rol',
  verificarRol('administrador', 'usuario'),
  validateRequest(CambiarRolIntegranteSchema),
  integranteCuerpoController.cambiarRol,
);

/**
 * GET /api/integrantes-cuerpo/miembro/:miembro_id - Obtener grupos de un miembro
 * Permisos: admin, lider, miembro (solo su propio miembro_id)
 */
integranteCuerpoRegistry.registerPath({
  method: 'get',
  path: '/api/integrantes-cuerpo/miembro/{miembro_id}',
  tags: ['Integrantes de Cuerpo'],
  request: {
    params: GetIntegrantesByMiembroSchema.shape.params,
  },
  responses: createApiResponse(
    z.array(IntegranteCuerpoConNombresSchema),
    'Integraciones encontradas',
  ),
});
integranteCuerpoRouter.get(
  '/miembro/:miembro_id',
  verificarRol('administrador', 'usuario'),
  validateRequest(GetIntegrantesByMiembroSchema),
  integranteCuerpoController.getIntegrantesByMiembro,
);

/**
 * GET /api/integrantes-cuerpo/grupo/:grupo_id - Obtener miembros de un grupo
 * Permisos: admin, lider
 */
integranteCuerpoRegistry.registerPath({
  method: 'get',
  path: '/api/integrantes-cuerpo/grupo/{grupo_id}',
  tags: ['Integrantes de Cuerpo'],
  request: {
    params: GetIntegrantesByGrupoSchema.shape.params,
  },
  responses: createApiResponse(
    z.array(IntegranteCuerpoConNombresSchema),
    'Miembros del grupo encontrados',
  ),
});
integranteCuerpoRouter.get(
  '/grupo/:grupo_id',
  validateRequest(GetIntegrantesByGrupoSchema),
  integranteCuerpoController.getIntegrantesByGrupo,
);
