import type { Request, RequestHandler, Response } from 'express';
import type { GetActividadesQuery } from './actividadesModel';
import { actividadesService } from './actividadesService';

/**
 * Controlador para manejar peticiones HTTP de Actividades
 */
class ActividadesController {
  /**
   * Obtiene todas las actividades con filtros opcionales (paginado)
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const query = req.query as unknown as GetActividadesQuery;
    const serviceResponse = await actividadesService.findAllPaginated(query);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene solo actividades públicas programadas futuras
   */
  public getPublicas: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await actividadesService.findPublicas();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene una actividad por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await actividadesService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea una nueva actividad
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const usuario = {
      rol: req.usuario!.rol,
      miembro_id: req.usuario!.miembro_id,
    };
    const serviceResponse = await actividadesService.create(req.body, usuario);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza una actividad existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const usuario = {
      rol: req.usuario!.rol,
      miembro_id: req.usuario!.miembro_id,
    };
    const serviceResponse = await actividadesService.update(id, req.body, usuario);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado de una actividad
   */
  public updateEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const usuario = {
      rol: req.usuario!.rol,
      miembro_id: req.usuario!.miembro_id,
    };
    const serviceResponse = await actividadesService.updateEstado(
      id,
      req.body.estado,
      req.body.motivo_cancelacion,
      usuario,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const actividadesController = new ActividadesController();
