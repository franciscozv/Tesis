import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { env } from '@/common/utils/envConfig';

/**
 * Payload del JWT (roles globales permitidos: 'administrador' | 'usuario')
 */
export interface JwtPayload {
  id: number;
  email: string;
  rol: 'administrador' | 'usuario';
  miembro_id: number | null;
  /** grupo_id del grupo donde el usuario es encargado activo (si aplica) */
  cuerpo_id?: number;
}

/**
 * Extiende Request de Express para incluir el usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

/**
 * Middleware que valida el JWT en el header Authorization Bearer.
 */
export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response = ServiceResponse.failure(
      'Token de acceso requerido',
      null,
      StatusCodes.UNAUTHORIZED,
    );
    res.status(response.statusCode).send(response);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (payload.rol !== 'administrador' && payload.rol !== 'usuario') {
      const response = ServiceResponse.failure(
        'Token inválido: rol no permitido',
        null,
        StatusCodes.UNAUTHORIZED,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    req.usuario = payload;
    next();
  } catch (error) {
    const message =
      (error as Error).name === 'TokenExpiredError'
        ? 'Token expirado, inicie sesión nuevamente'
        : 'Token inválido';

    const response = ServiceResponse.failure(message, null, StatusCodes.UNAUTHORIZED);
    res.status(response.statusCode).send(response);
  }
};

/**
 * Middleware que verifica que el rol del usuario esté en los roles permitidos
 */
export const verificarRol = (...rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      const response = ServiceResponse.failure('No autenticado', null, StatusCodes.UNAUTHORIZED);
      res.status(response.statusCode).send(response);
      return;
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      const response = ServiceResponse.failure(
        'No tiene permisos para realizar esta acción',
        null,
        StatusCodes.FORBIDDEN,
      );
      res.status(response.statusCode).send(response);
      return;
    }

    next();
  };
};
