import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarRol, verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { candidatosController } from './candidatosController';
import {
  CandidatoCargoSchema,
  CandidatoSchema,
  SugerirCargoResponseSchema,
  SugerirCargoSchema,
  SugerirRolSchema,
} from './candidatosModel';

export const candidatosRegistry = new OpenAPIRegistry();
export const candidatosRouter: Router = express.Router();

// Registrar schemas en OpenAPI
candidatosRegistry.register('Candidato', CandidatoSchema);
candidatosRegistry.register('CandidatoCargo', CandidatoCargoSchema);
candidatosRegistry.register('SugerirCargoResponse', SugerirCargoResponseSchema);

// Todas las rutas requieren autenticación
candidatosRouter.use(verificarToken);

// POST /api/candidatos/sugerir-rol
candidatosRegistry.registerPath({
  method: 'post',
  path: '/api/candidatos/sugerir-rol',
  tags: ['Candidatos'],
  summary: 'Sugerir candidatos para un rol en actividad (indicadores crudos, sin scoring)',
  description: [
    'Retorna hasta 20 candidatos ordenados por: disponibilidad en la fecha, ',
    'experiencia en el tipo de actividad, experiencia total en el rol, ',
    'ratio de asistencia en el periodo y antigüedad. ',
    'SEGURIDAD: si el token contiene `cuerpo_id` (usuario es encargado de un grupo), ',
    'el filtro de cuerpo se aplica automáticamente e ignora cualquier `cuerpo_id` del body. ',
    'Solo ADMIN puede enviar `cuerpo_id` en el body para filtrar un grupo concreto; ',
    'sin él, la búsqueda es global.',
    'ACCESO: Administrador y Usuario.',
  ].join(''),
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
  verificarRol('administrador', 'usuario'),
  validateRequest(SugerirRolSchema),
  candidatosController.sugerirRol,
);

// POST /api/candidatos/sugerir-cargo
candidatosRegistry.registerPath({
  method: 'post',
  path: '/api/candidatos/sugerir-cargo',
  tags: ['Candidatos'],
  summary:
    'Sugerir candidatos para un cargo en grupo ministerial (indicadores crudos, sin scoring)',
  description: [
    'Retorna hasta 20 candidatos ordenados por: experiencia en el cargo dentro del cuerpo DESC, ',
    'grupos activos ASC (prioriza al menos ocupado), ratio de asistencia DESC, antigüedad DESC. ',
    'SEGURIDAD: si el token contiene `cuerpo_id`, se usa ese automáticamente. ',
    'Si es ADMIN y no hay `cuerpo_id` en el token, debe enviarlo en el body; ',
    'de lo contrario se retorna error 400. ',
    'Si el cargo requiere plena comunión, el filtro duro se aplica automáticamente. ',
    'La respuesta incluye un objeto `metadata` con los parámetros efectivos usados.',
    'ACCESO: Solo rol administrador.',
  ].join(''),
  request: {
    body: {
      content: {
        'application/json': {
          schema: SugerirCargoSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(SugerirCargoResponseSchema, 'Success'),
});
candidatosRouter.post(
  '/sugerir-cargo',
  verificarRol('administrador'),
  validateRequest(SugerirCargoSchema),
  candidatosController.sugerirCargo,
);
