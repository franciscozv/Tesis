import type { Request, RequestHandler, Response } from 'express';
import { patronesActividadService } from './patronesActividadService';

/**
 * Controlador para manejar peticiones HTTP de Patrones de Actividad
 */
class PatronesActividadController {
  /**
   * Obtiene todos los patrones de actividad activos
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await patronesActividadService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un patrón de actividad por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await patronesActividadService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo patrón de actividad
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await patronesActividadService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un patrón de actividad existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await patronesActividadService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Activa o desactiva un patrón de actividad
   */
  public updateEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await patronesActividadService.updateEstado(id, req.body.activo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Genera instancias de actividades a partir de patrones activos
   */
  public generarInstancias: RequestHandler = async (req: Request, res: Response) => {
    const { mes, anio } = req.body;
    const creadorId = req.usuario!.id;
    const serviceResponse = await patronesActividadService.generarInstancias(mes, anio, creadorId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const patronesActividadController = new PatronesActividadController();
