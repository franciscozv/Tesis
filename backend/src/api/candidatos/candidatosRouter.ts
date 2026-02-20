import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken, verificarRol } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { candidatosController } from './candidatosController';
import { CandidatoSchema, SugerirCargoSchema, SugerirRolSchema } from './candidatosModel';

export const candidatosRegistry = new OpenAPIRegistry();
export const candidatosRouter: Router = express.Router();

// Registrar schema en OpenAPI
candidatosRegistry.register('Candidato', CandidatoSchema);

// Todas las rutas requieren autenticación + rol administrador o lider
candidatosRouter.use(verificarToken, verificarRol('administrador', 'lider'));

// POST /api/candidatos/sugerir-rol - Sugerir candidatos para rol en actividad
candidatosRegistry.registerPath({
  method: 'post',
  path: '/api/candidatos/sugerir-rol',
  tags: ['Candidatos'],
  summary: 'Sugerir candidatos idóneos para un rol en actividad (scoring automático)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SugerirRolSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.array(CandidatoSchema), 'Success'),
});
candidatosRouter.post(
  '/sugerir-rol',
  validateRequest(SugerirRolSchema),
  candidatosController.sugerirRol
);

// POST /api/candidatos/sugerir-cargo - Sugerir candidatos para cargo en grupo
candidatosRegistry.registerPath({
  method: 'post',
  path: '/api/candidatos/sugerir-cargo',
  tags: ['Candidatos'],
  summary: 'Sugerir candidatos idóneos para un cargo en grupo ministerial (scoring automático)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SugerirCargoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(z.array(CandidatoSchema), 'Success'),
});
candidatosRouter.post(
  '/sugerir-cargo',
  validateRequest(SugerirCargoSchema),
  candidatosController.sugerirCargo
);
