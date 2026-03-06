import type { Request, RequestHandler, Response } from 'express';
import { responsabilidadesActividadService } from './rolesActividadService';

/**
 * Controlador para manejar peticiones HTTP de Responsabilidades de Actividad
 */
class ResponsabilidadesActividadController {
  /**
   * Obtiene todos los roles activos
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
    const serviceResponse = await responsabilidadesActividadService.findAll(activo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un rol por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await responsabilidadesActividadService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo rol
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await responsabilidadesActividadService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un rol existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await responsabilidadesActividadService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado activo/inactivo de un responsabilidad de actividad
   */
  public toggleEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await responsabilidadesActividadService.toggleEstado(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un rol (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await responsabilidadesActividadService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const responsabilidadesActividadController = new ResponsabilidadesActividadController();


