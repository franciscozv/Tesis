import type { Request, RequestHandler, Response } from 'express';

import { grupoMinisterialService } from '@/api/gruposMinisteriales/grupoMinisterialService';

/**
 * Controller para manejar requests HTTP de Grupos Ministeriales
 */
class GrupoMinisterialController {
  /**
   * GET /grupos - Obtiene todos los grupos activos
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await grupoMinisterialService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /grupos/:id - Obtiene un grupo por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await grupoMinisterialService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * POST /grupos - Crea un nuevo grupo
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await grupoMinisterialService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PUT /grupos/:id - Actualiza un grupo existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await grupoMinisterialService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * DELETE /grupos/:id - Elimina lógicamente un grupo (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await grupoMinisterialService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /grupos/mis-grupos - Obtiene los grupos que el usuario puede gestionar
   */
  public getMisGrupos: RequestHandler = async (req: Request, res: Response) => {
    const rol = req.usuario!.rol;
    const miembro_id = req.usuario!.miembro_id;
    const serviceResponse = await grupoMinisterialService.findMisGrupos(rol, miembro_id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const grupoMinisterialController = new GrupoMinisterialController();
