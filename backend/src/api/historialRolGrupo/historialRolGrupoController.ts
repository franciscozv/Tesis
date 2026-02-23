import type { Request, RequestHandler, Response } from 'express';
import { historialRolGrupoService } from './historialRolGrupoService';

/**
 * Controlador para manejar peticiones HTTP del Historial de Rol en Grupo
 */
class HistorialRolGrupoController {
  /**
   * Obtiene todos los registros de historial con filtros opcionales
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      miembro_grupo_id: req.query.miembro_grupo_id ? Number(req.query.miembro_grupo_id) : undefined,
    };
    const serviceResponse = await historialRolGrupoService.findAll(filters);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un registro de historial por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await historialRolGrupoService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Registra un cambio de rol
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await historialRolGrupoService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const historialRolGrupoController = new HistorialRolGrupoController();
