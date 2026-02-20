import type { Request, RequestHandler, Response } from 'express';
import { actividadesService } from './actividadesService';

/**
 * Controlador para manejar peticiones HTTP de Actividades
 */
class ActividadesController {
  /**
   * Obtiene todas las actividades con filtros opcionales
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      mes: req.query.mes ? Number(req.query.mes) : undefined,
      anio: req.query.anio ? Number(req.query.anio) : undefined,
      estado: req.query.estado as string | undefined,
      es_publica: req.query.es_publica !== undefined ? req.query.es_publica === 'true' : undefined,
    };
    const serviceResponse = await actividadesService.findAll(filters);
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
    const serviceResponse = await actividadesService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado de una actividad
   */
  public updateEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await actividadesService.updateEstado(
      id,
      req.body.estado,
      req.body.motivo_cancelacion
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const actividadesController = new ActividadesController();
