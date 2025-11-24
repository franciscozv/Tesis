import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from './authService';
import type { JWTPayload } from './authModel';

/**
 * Extender el tipo Request para incluir user
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware para autenticar token JWT
 * Lee el header Authorization: Bearer {token}
 * Verifica el token y agrega usuario a req.user
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obtener header de autorización
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    // Verificar formato: Bearer {token}
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer {token}',
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const token = parts[1];

    // Verificar token
    const payload = authService.verifyToken(token);

    if (!payload) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token inválido o expirado',
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    // Agregar usuario al request
    req.user = payload;

    // Continuar
    next();
  } catch (error) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Error al verificar token',
      responseObject: null,
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  }
};
