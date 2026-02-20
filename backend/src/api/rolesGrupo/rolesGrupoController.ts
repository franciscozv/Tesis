import type { Request, RequestHandler, Response } from 'express';
import { rolesGrupoService } from './rolesGrupoService';

/**
 * Controller para manejar requests HTTP de Roles de Grupos Ministeriales
 */
class RolesGrupoController {
  /**
   * Obtiene todos los roles activos
   * GET /api/roles-grupo
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
    const serviceResponse = await rolesGrupoService.findAll(activo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un rol por ID
   * GET /api/roles-grupo/:id
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await rolesGrupoService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo rol de grupo
   * POST /api/roles-grupo
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const { nombre, requiere_plena_comunion } = req.body;
    const serviceResponse = await rolesGrupoService.create(nombre, requiere_plena_comunion);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza un rol de grupo
   * PUT /api/roles-grupo/:id
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await rolesGrupoService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado activo/inactivo de un rol de grupo
   * PATCH /api/roles-grupo/:id/toggle-estado
   */
  public toggleEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await rolesGrupoService.toggleEstado(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un rol de grupo (soft delete)
   * DELETE /api/roles-grupo/:id
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await rolesGrupoService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const rolesGrupoController = new RolesGrupoController();
