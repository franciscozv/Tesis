import type { Request, RequestHandler, Response } from 'express';
import { colaboradoresService } from './colaboradoresService';

/**
 * Controlador para manejar peticiones HTTP de Colaboradores
 */
class ColaboradoresController {
  /**
   * Obtiene todos los colaboradores con filtros opcionales
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      necesidad_id: req.query.necesidad_id ? Number(req.query.necesidad_id) : undefined,
      miembro_id: req.query.miembro_id ? Number(req.query.miembro_id) : undefined,
    };
    const serviceResponse = await colaboradoresService.findAll(filters, req.usuario);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un colaborador por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await colaboradoresService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Registra un nuevo compromiso de colaboración
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await colaboradoresService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Marca si un colaborador cumplió su compromiso
   */
  public marcarCumplio: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await colaboradoresService.marcarCumplio(
      id,
      req.body.cumplio,
      req.usuario,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un compromiso de colaboración
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await colaboradoresService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const colaboradoresController = new ColaboradoresController();
