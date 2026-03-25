import type { Request, RequestHandler, Response } from 'express';
import { historialEstadoService } from './historialEstadoService';

/**
 * Controlador para manejar peticiones HTTP del Historial de Estado de Membresía
 */
class HistorialEstadoController {
  /**
   * Obtiene todos los registros de historial con filtros opcionales
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      miembro_id: req.query.miembro_id ? Number(req.query.miembro_id) : undefined,
    };
    const serviceResponse = await historialEstadoService.findAll(filters);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene historial de estados de un miembro con datos del usuario
   */
  public getByMiembro: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = Number(req.query.miembro_id);
    const serviceResponse = await historialEstadoService.findByMiembro(miembroId, req.usuario!);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un registro de historial por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await historialEstadoService.findById(id, req.usuario!);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Registra un cambio de estado
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await historialEstadoService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const historialEstadoController = new HistorialEstadoController();
