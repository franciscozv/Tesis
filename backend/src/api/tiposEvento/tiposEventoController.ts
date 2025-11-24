import type { Request, RequestHandler, Response } from 'express';
import { tiposEventoService } from './tiposEventoService';

class TiposEventoController {
  /**
   * Obtiene todos los tipos de evento activos
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await tiposEventoService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un tipo de evento por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposEventoService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo tipo de evento
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await tiposEventoService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un tipo de evento existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposEventoService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un tipo de evento (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposEventoService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const tiposEventoController = new TiposEventoController();
