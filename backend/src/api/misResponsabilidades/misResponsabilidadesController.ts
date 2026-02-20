import type { Request, RequestHandler, Response } from 'express';
import { misResponsabilidadesService } from './misResponsabilidadesService';

class MisResponsabilidadesController {
  /**
   * GET /mis-responsabilidades - Obtiene invitaciones + colaboraciones del usuario autenticado
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = req.usuario!.miembro_id;
    const serviceResponse = await misResponsabilidadesService.findAll(miembroId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const misResponsabilidadesController = new MisResponsabilidadesController();
