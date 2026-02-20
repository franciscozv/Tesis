import type { Request, RequestHandler, Response } from 'express';
import { necesidadesLogisticasService } from './necesidadesLogisticasService';

/**
 * Controlador para manejar peticiones HTTP de Necesidades Logísticas
 */
class NecesidadesLogisticasController {
  /**
   * Obtiene todas las necesidades logísticas con filtros opcionales
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      estado: req.query.estado as string | undefined,
      actividad_id: req.query.actividad_id ? Number(req.query.actividad_id) : undefined,
    };
    const serviceResponse = await necesidadesLogisticasService.findAll(filters);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene necesidades abiertas de actividades próximas (60 días)
   */
  public getAbiertas: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await necesidadesLogisticasService.findAbiertas();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene una necesidad logística por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await necesidadesLogisticasService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea una nueva necesidad logística
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await necesidadesLogisticasService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza una necesidad logística existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await necesidadesLogisticasService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado de una necesidad logística
   */
  public updateEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await necesidadesLogisticasService.updateEstado(id, req.body.estado);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina una necesidad logística
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await necesidadesLogisticasService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const necesidadesLogisticasController = new NecesidadesLogisticasController();
