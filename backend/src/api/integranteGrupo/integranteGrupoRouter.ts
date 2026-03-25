import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { integranteGrupoController } from './integranteGrupoController';
import {
  CambiarRolIntegranteSchema,
  DesvincularMiembroSchema,
  GetHistorialDirectivaSchema,
  GetIntegrantesByGrupoSchema,
  GetIntegrantesByMiembroSchema,
  IntegranteGrupoConNombresSchema,
  IntegranteGrupoSchema,
  RenovarDirectivaMasivaSchema,
  VincularMiembroSchema,
} from './integranteGrupoModel';

export const integranteGrupoRegistry = new OpenAPIRegistry();
export const integranteGrupoRouter: Router = express.Router();

// Registrar schema principal
integranteGrupoRegistry.register('IntegranteGrupo', IntegranteGrupoSchema);

// Todas las rutas requieren autenticación
integranteGrupoRouter.use(verificarToken);

/**
 * POST /api/integrantes-grupo - Vincular miembro a grupo (RF_06)
 * Permisos: admin, lider
 */
integranteGrupoRegistry.registerPath({
  method: 'post',
  path: '/api/integrantes-grupo',
  tags: ['Integrantes de Grupo'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: VincularMiembroSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(IntegranteGrupoSchema, 'Miembro vinculado exitosamente'),
});
integranteGrupoRouter.post(
  '/',
  verificarRol('administrador', 'usuario'),
  validateRequest(VincularMiembroSchema),
  integranteGrupoController.vincularMiembro,
);

/**
 * PATCH /api/integrantes-grupo/:id/desvincular - Desvincular miembro (RF_07)
 * Permisos: admin, secretario, lider
 */
integranteGrupoRegistry.registerPath({
  method: 'patch',
  path: '/api/integrantes-grupo/{id}/desvincular',
  tags: ['Integrantes de Grupo'],
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
  responses: createApiResponse(IntegranteGrupoSchema, 'Miembro desvinculado exitosamente'),
});
integranteGrupoRouter.patch(
  '/:id/desvincular',
  verificarRol('administrador', 'usuario'),
  validateRequest(DesvincularMiembroSchema),
  integranteGrupoController.desvincularMiembro,
);

/**
 * PATCH /api/integrantes-grupo/:id/cambiar-rol - Cambiar rol de una membresía activa
 * Permisos: admin, lider
 */
integranteGrupoRegistry.registerPath({
  method: 'patch',
  path: '/api/integrantes-grupo/{id}/cambiar-rol',
  tags: ['Integrantes de Grupo'],
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
  responses: createApiResponse(IntegranteGrupoSchema, 'Rol cambiado exitosamente'),
});
integranteGrupoRouter.patch(
  '/:id/cambiar-rol',
  verificarRol('administrador', 'usuario'),
  validateRequest(CambiarRolIntegranteSchema),
  integranteGrupoController.cambiarRol,
);

/**
 * GET /api/integrantes-grupo/miembro/:miembro_id - Obtener grupos de un miembro
 * Permisos: admin, lider, miembro (solo su propio miembro_id)
 */
integranteGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/integrantes-grupo/miembro/{miembro_id}',
  tags: ['Integrantes de Grupo'],
  request: {
    params: GetIntegrantesByMiembroSchema.shape.params,
  },
  responses: createApiResponse(
    z.array(IntegranteGrupoConNombresSchema),
    'Integraciones encontradas',
  ),
});
integranteGrupoRouter.get(
  '/miembro/:miembro_id',
  verificarRol('administrador', 'usuario'),
  validateRequest(GetIntegrantesByMiembroSchema),
  integranteGrupoController.getIntegrantesByMiembro,
);

/**
 * GET /api/integrantes-grupo/grupo/:grupo_id - Obtener miembros de un grupo
 * Permisos: admin, lider
 */
integranteGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/integrantes-grupo/grupo/{grupo_id}',
  tags: ['Integrantes de Grupo'],
  request: {
    params: GetIntegrantesByGrupoSchema.shape.params,
  },
  responses: createApiResponse(
    z.array(IntegranteGrupoConNombresSchema),
    'Miembros del grupo encontrados',
  ),
});
integranteGrupoRouter.get(
  '/grupo/:grupo_id',
  validateRequest(GetIntegrantesByGrupoSchema),
  integranteGrupoController.getIntegrantesByGrupo,
);

/**
 * POST /api/integrantes-grupo/grupo/:grupo_id/renovar-directiva
 * Renovación masiva de directiva - solo administradores
 */
integranteGrupoRegistry.registerPath({
  method: 'post',
  path: '/api/integrantes-grupo/grupo/{grupo_id}/renovar-directiva',
  tags: ['Integrantes de Grupo'],
  request: {
    params: RenovarDirectivaMasivaSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: RenovarDirectivaMasivaSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.array(IntegranteGrupoSchema), 'Directiva renovada exitosamente'),
});
integranteGrupoRouter.post(
  '/grupo/:grupo_id/renovar-directiva',
  verificarRol('administrador', 'usuario'),
  validateRequest(RenovarDirectivaMasivaSchema),
  integranteGrupoController.renovarDirectivaMasiva,
);

/**
 * GET /api/integrantes-grupo/grupo/:grupo_id/historial-directiva
 * Historial de directiva de un grupo
 */
integranteGrupoRegistry.registerPath({
  method: 'get',
  path: '/api/integrantes-grupo/grupo/{grupo_id}/historial-directiva',
  tags: ['Integrantes de Grupo'],
  request: {
    params: GetHistorialDirectivaSchema.shape.params,
  },
  responses: createApiResponse(
    z.array(IntegranteGrupoConNombresSchema),
    'Historial de directiva obtenido',
  ),
});
integranteGrupoRouter.get(
  '/grupo/:grupo_id/historial-directiva',
  verificarRol('administrador', 'usuario'),
  validateRequest(GetHistorialDirectivaSchema),
  integranteGrupoController.getHistorialDirectiva,
);
