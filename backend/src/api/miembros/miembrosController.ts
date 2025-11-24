import type { Request, RequestHandler, Response } from 'express';

import { miembrosService } from '@/api/miembros/miembrosService';

/**
 * Controller para manejar requests HTTP de Miembros
 */
class MiembrosController {
  /**
   * GET /miembros - Obtiene todos los miembros activos
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await miembrosService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /miembros/:id - Obtiene un miembro por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await miembrosService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * POST /miembros - Crea un nuevo miembro (RF_01: Registrar nuevo miembro)
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await miembrosService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PUT /miembros/:id - Actualiza un miembro existente (RF_03: Actualizar información)
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await miembrosService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * DELETE /miembros/:id - Elimina lógicamente un miembro (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await miembrosService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PATCH /miembros/:id/estado - Cambia el estado de membresía (RF_05)
   */
  public changeEstadoMembresia: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const { estado_membresia } = req.body;
    const serviceResponse = await miembrosService.changeEstadoMembresia(id, estado_membresia);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const miembrosController = new MiembrosController();
