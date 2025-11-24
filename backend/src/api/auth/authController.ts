import type { Request, RequestHandler, Response } from 'express';
import { authService } from './authService';

class AuthController {
  /**
   * Registrar un nuevo usuario
   */
  public register: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await authService.register(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Login de usuario
   */
  public login: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await authService.login(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtener información del usuario autenticado
   */
  public getMe: RequestHandler = async (req: Request, res: Response) => {
    // req.user es agregado por el middleware authenticateToken
    const id_usuario = req.user!.id_usuario;
    const serviceResponse = await authService.getMe(id_usuario);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambiar contraseña del usuario autenticado
   */
  public cambiarPassword: RequestHandler = async (req: Request, res: Response) => {
    const id_usuario = req.user!.id_usuario;
    const { password_actual, password_nueva } = req.body;
    const serviceResponse = await authService.cambiarPassword(
      id_usuario,
      password_actual,
      password_nueva
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const authController = new AuthController();
