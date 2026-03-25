import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { env } from '@/common/utils/envConfig';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Payload del JWT — id corresponde al miembro.id (tabla unificada)
 */
export interface JwtPayload {
  id: number;
  email: string;
  rol: 'administrador' | 'usuario';
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
 * Middleware que valida el JWT y verifica que el miembro siga activo en BD.
 */
export const verificarToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    const message =
      (error as Error).name === 'TokenExpiredError'
        ? 'Token expirado, inicie sesión nuevamente'
        : 'Token inválido';
    res
      .status(StatusCodes.UNAUTHORIZED)
      .send(ServiceResponse.failure(message, null, StatusCodes.UNAUTHORIZED));
    return;
  }

  if (payload.rol !== 'administrador' && payload.rol !== 'usuario') {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .send(
        ServiceResponse.failure('Token inválido: rol no permitido', null, StatusCodes.UNAUTHORIZED),
      );
    return;
  }

  // Verificar que el miembro siga activo en BD (cubre inactivación con token vigente)
  const { data } = await supabase.from('miembro').select('activo').eq('id', payload.id).single();

  if (!data?.activo) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .send(ServiceResponse.failure('Cuenta inactiva o eliminada', null, StatusCodes.UNAUTHORIZED));
    return;
  }

  req.usuario = payload;
  next();
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
