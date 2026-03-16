import type { Request, RequestHandler, Response } from 'express';
import { grupoRolService } from './grupoRolService';

class GrupoRolController {
  public getRolesPorGrupo: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const serviceResponse = await grupoRolService.getRolesPorGrupo(grupoId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public habilitarRol: RequestHandler = async (req: Request, res: Response) => {
    const { grupo_id, rol_grupo_id } = req.body;
    const serviceResponse = await grupoRolService.habilitarRol(grupo_id, rol_grupo_id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deshabilitarRol: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const rolId = Number.parseInt(req.params.rol_grupo_id, 10);
    const serviceResponse = await grupoRolService.deshabilitarRol(grupoId, rolId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const grupoRolController = new GrupoRolController();
