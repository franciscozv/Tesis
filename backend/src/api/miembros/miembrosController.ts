import type { Request, RequestHandler, Response } from 'express';

import type { GetMiembrosQuery } from '@/api/miembros/miembrosModel';
import { miembrosService } from '@/api/miembros/miembrosService';

/**
 * Controller para manejar requests HTTP de Miembros
 */
class MiembrosController {
  /**
   * GET /miembros - Obtiene miembros paginados con búsqueda y filtros
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await miembrosService.findAllPaginated(
      req.query as unknown as GetMiembrosQuery,
      req.usuario!,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /miembros/:id - Obtiene un miembro por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await miembrosService.findById(id, req.usuario!);
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
   * PATCH /miembros/:id/reactivar - Reactiva un miembro inactivo
   */
  public reactivar: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await miembrosService.reactivar(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PATCH /miembros/mi-perfil - Actualiza datos de contacto del perfil propio
   */
  public updateMiPerfil: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = req.usuario!.id;
    const serviceResponse = await miembrosService.updateMiPerfil(miembroId, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PATCH /miembros/:id/estado - Cambia el estado de membresía (RF_05)
   */
  public changeEstadoComunion: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const { estado_nuevo, motivo } = req.body;
    const usuario_id = req.usuario!.id;
    const serviceResponse = await miembrosService.changeEstadoComunion(
      id,
      estado_nuevo,
      motivo,
      usuario_id,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PUT /miembros/:id/cuenta - Actualiza cuenta de acceso de un miembro
   */
  public actualizarCuenta: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await miembrosService.actualizarCuenta(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * PATCH /miembros/:id/password - Restablece contraseÃ±a de un miembro
   */
  public resetPassword: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const { nueva_password } = req.body;
    const serviceResponse = await miembrosService.resetPassword(id, nueva_password);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const miembrosController = new MiembrosController();
