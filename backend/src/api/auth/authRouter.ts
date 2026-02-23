import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken } from '@/common/middleware/authMiddleware';
import { validateRequest } from '@/common/utils/httpHandlers';
import { authController } from './authController';
import {
  CambiarPasswordSchema,
  LoginResponseSchema,
  LoginSchema,
  MensajeResponseSchema,
  RecuperarPasswordSchema,
  ResetPasswordSchema,
} from './authModel';

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

// POST /api/auth/login - Iniciar sesión
authRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Autenticación'],
  summary: 'Iniciar sesión con email y contraseña',
  security: [],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(LoginResponseSchema, 'Success'),
});
authRouter.post('/login', validateRequest(LoginSchema), authController.login);

// POST /api/auth/recuperar-password - Solicitar recuperación de contraseña
authRegistry.registerPath({
  method: 'post',
  path: '/api/auth/recuperar-password',
  tags: ['Autenticación'],
  summary: 'Solicitar recuperación de contraseña por email',
  security: [],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RecuperarPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MensajeResponseSchema, 'Success'),
});
authRouter.post(
  '/recuperar-password',
  validateRequest(RecuperarPasswordSchema),
  authController.recuperarPassword,
);

// POST /api/auth/reset-password - Restablecer contraseña con token de recuperación
authRegistry.registerPath({
  method: 'post',
  path: '/api/auth/reset-password',
  tags: ['Autenticación'],
  summary: 'Restablecer contraseña usando token de recuperación enviado por email',
  security: [],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ResetPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MensajeResponseSchema, 'Success'),
});
authRouter.post(
  '/reset-password',
  validateRequest(ResetPasswordSchema),
  authController.resetPassword,
);

// PATCH /api/auth/cambiar-password - Cambiar contraseña (requiere token)
authRegistry.registerPath({
  method: 'patch',
  path: '/api/auth/cambiar-password',
  tags: ['Autenticación'],
  summary: 'Cambiar contraseña del usuario autenticado',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CambiarPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(MensajeResponseSchema, 'Success'),
});
authRouter.patch(
  '/cambiar-password',
  verificarToken,
  validateRequest(CambiarPasswordSchema),
  authController.cambiarPassword,
);
