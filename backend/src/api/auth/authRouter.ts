import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { authController } from './authController';
import { authenticateToken } from './authMiddleware';
import {
  CambiarPasswordSchema,
  LoginResponseSchema,
  LoginSchema,
  RegisterSchema,
  UsuarioConMiembroSchema,
  UsuarioPublicoSchema,
} from './authModel';

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

authRegistry.register('UsuarioPublico', UsuarioPublicoSchema);
authRegistry.register('UsuarioConMiembro', UsuarioConMiembroSchema);
authRegistry.register('LoginResponse', LoginResponseSchema);

// POST /api/auth/register - Registrar un nuevo usuario
authRegistry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Autenticación'],
  request: {
    body: { content: { 'application/json': { schema: RegisterSchema.shape.body } } },
  },
  responses: createApiResponse(UsuarioPublicoSchema, 'Success'),
});
authRouter.post('/register', validateRequest(RegisterSchema), authController.register);

// POST /api/auth/login - Login de usuario
authRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Autenticación'],
  request: {
    body: { content: { 'application/json': { schema: LoginSchema.shape.body } } },
  },
  responses: createApiResponse(LoginResponseSchema, 'Success'),
});
authRouter.post('/login', validateRequest(LoginSchema), authController.login);

// GET /api/auth/me - Obtener información del usuario autenticado (protegido)
authRegistry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Autenticación'],
  security: [{ bearerAuth: [] }],
  responses: createApiResponse(UsuarioConMiembroSchema, 'Success'),
});
authRouter.get('/me', authenticateToken, authController.getMe);

// PATCH /api/auth/cambiar-password - Cambiar contraseña (protegido)
authRegistry.registerPath({
  method: 'patch',
  path: '/api/auth/cambiar-password',
  tags: ['Autenticación'],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: CambiarPasswordSchema.shape.body } } },
  },
  responses: createApiResponse(z.null(), 'Success'),
});
authRouter.patch(
  '/cambiar-password',
  authenticateToken,
  validateRequest(CambiarPasswordSchema),
  authController.cambiarPassword,
);
