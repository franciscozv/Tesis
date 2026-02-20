import type { Request, RequestHandler, Response } from 'express';
import { tiposNecesidadService } from './tiposNecesidadService';

/**
 * Controlador para manejar peticiones HTTP de Tipos de Necesidad Logística
 */
class TiposNecesidadController {
  /**
   * Obtiene todos los tipos de necesidad activos
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
    const serviceResponse = await tiposNecesidadService.findAll(activo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un tipo de necesidad por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposNecesidadService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo tipo de necesidad
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await tiposNecesidadService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un tipo de necesidad existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposNecesidadService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado activo/inactivo de un tipo de necesidad
   */
  public toggleEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposNecesidadService.toggleEstado(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un tipo de necesidad (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await tiposNecesidadService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const tiposNecesidadController = new TiposNecesidadController();
