import type { Request, RequestHandler, Response } from 'express';
import { tiposActividadService } from './tiposActividadService';

/**
 * Controlador para manejar peticiones HTTP de Tipos de Actividad
 */
class TiposActividadController {
  /**
   * Obtiene todos los tipos de actividad activos
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
    const serviceResponse = await tiposActividadService.findAll(activo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un tipo de actividad por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposActividadService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo tipo de actividad
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await tiposActividadService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un tipo de actividad existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposActividadService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado activo/inactivo de un tipo de actividad
   */
  public toggleEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposActividadService.toggleEstado(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un tipo de actividad (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposActividadService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const tiposActividadController = new TiposActividadController();
