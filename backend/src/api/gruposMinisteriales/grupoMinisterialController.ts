import type { Request, RequestHandler, Response } from 'express';

import { grupoMinisterialService } from '@/api/gruposMinisteriales/grupoMinisterialService';

/**
 * Controller para manejar requests HTTP de Grupos Ministeriales
 */
class GrupoMinisterialController {
  /**
   * GET /grupos-ministeriales - Obtiene todos los grupos ministeriales activos
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await grupoMinisterialService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /grupos-ministeriales/:id - Obtiene un grupo ministerial por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await grupoMinisterialService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * POST /grupos-ministeriales - Crea un nuevo grupo ministerial
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await grupoMinisterialService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PUT /grupos-ministeriales/:id - Actualiza un grupo ministerial existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await grupoMinisterialService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * DELETE /grupos-ministeriales/:id - Elimina lógicamente un grupo ministerial (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await grupoMinisterialService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const grupoMinisterialController = new GrupoMinisterialController();
