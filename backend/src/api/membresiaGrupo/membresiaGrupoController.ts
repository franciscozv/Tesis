import type { Request, RequestHandler, Response } from 'express';
import { membresiaGrupoService } from './membresiaGrupoService';

/**
 * Controller para manejar requests HTTP de Membresía en Grupos Ministeriales
 */
class MembresiaGrupoController {
  /**
   * Vincula un miembro a un grupo ministerial (RF_06)
   * POST /api/membresia-grupo
   */
  public vincularMiembro: RequestHandler = async (req: Request, res: Response) => {
    const { miembro_id, grupo_id, rol_grupo_id, fecha_vinculacion } = req.body;
    const serviceResponse = await membresiaGrupoService.vincularMiembro(
      miembro_id,
      grupo_id,
      rol_grupo_id,
      fecha_vinculacion,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Desvincula un miembro de un grupo ministerial (RF_07)
   * PATCH /api/membresia-grupo/:id/desvincular
   */
  public desvincularMiembro: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { fecha_desvinculacion } = req.body;
    const serviceResponse = await membresiaGrupoService.desvincularMiembro(
      id,
      fecha_desvinculacion,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene todas las membresías de un miembro
   * GET /api/membresia-grupo/miembro/:miembro_id
   */
  public getMembresiasByMiembro: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = Number.parseInt(req.params.miembro_id, 10);
    const serviceResponse = await membresiaGrupoService.getMembresiasByMiembro(miembroId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene todas las membresías activas de un grupo
   * GET /api/membresia-grupo/grupo/:grupo_id
   */
  public getMembresiasByGrupo: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const serviceResponse = await membresiaGrupoService.getMembresiasByGrupo(grupoId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const membresiaGrupoController = new MembresiaGrupoController();
