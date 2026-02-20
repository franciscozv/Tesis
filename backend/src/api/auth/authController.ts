import type { Request, RequestHandler, Response } from 'express';
import { authService } from './authService';

/**
 * Controlador para manejar peticiones HTTP de Autenticación
 */
class AuthController {
  /**
   * Inicia sesión y retorna JWT
   */
  public login: RequestHandler = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const serviceResponse = await authService.login(email, password);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia la contraseña del usuario autenticado
   */
  public cambiarPassword: RequestHandler = async (req: Request, res: Response) => {
    const usuarioId = req.usuario!.id;
    const { password_actual, password_nueva } = req.body;
    const serviceResponse = await authService.cambiarPassword(
      usuarioId,
      password_actual,
      password_nueva
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Solicita recuperación de contraseña
   */
  public recuperarPassword: RequestHandler = async (req: Request, res: Response) => {
    const { email } = req.body;
    const serviceResponse = await authService.recuperarPassword(email);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Restablece la contraseña con token de recuperación
   */
  public resetPassword: RequestHandler = async (req: Request, res: Response) => {
    const { token, nueva_password } = req.body;
    const serviceResponse = await authService.resetPassword(token, nueva_password);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const authController = new AuthController();
