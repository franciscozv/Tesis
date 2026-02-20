import type { Request, RequestHandler, Response } from 'express';
import { usuariosService } from './usuariosService';

/**
 * Controlador para manejar peticiones HTTP de Usuarios
 */
class UsuariosController {
  /**
   * Obtiene todos los usuarios
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await usuariosService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un usuario por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await usuariosService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo usuario
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await usuariosService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un usuario existente (email y/o rol)
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await usuariosService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Activa o desactiva un usuario
   */
  public updateEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await usuariosService.updateEstado(id, req.body.activo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const usuariosController = new UsuariosController();
