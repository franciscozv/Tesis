import type { Request, RequestHandler, Response } from 'express';
import { integranteCuerpoService } from './integranteCuerpoService';

/**
 * Controller para manejar requests HTTP de Integrantes en Cuerpo
 */
class IntegranteCuerpoController {
  /**
   * Vincula un miembro a un grupo ministerial (RF_06)
   * POST /api/integrantes-cuerpo
   */
  public vincularMiembro: RequestHandler = async (req: Request, res: Response) => {
    const { miembro_id, grupo_id, rol_grupo_id, fecha_vinculacion } = req.body;
    const serviceResponse = await integranteCuerpoService.vincularMiembro(
      miembro_id,
      grupo_id,
      rol_grupo_id,
      fecha_vinculacion,
      req.usuario?.rol,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Desvincula un miembro de un grupo ministerial (RF_07)
   * PATCH /api/integrantes-cuerpo/:id/desvincular
   */
  public desvincularMiembro: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { fecha_desvinculacion } = req.body;
    const serviceResponse = await integranteCuerpoService.desvincularMiembro(
      id,
      fecha_desvinculacion,
      req.usuario?.rol,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el rol de una integración activa
   * PATCH /api/integrantes-cuerpo/:id/cambiar-rol
   */
  public cambiarRol: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { rol_grupo_id } = req.body;
    const serviceResponse = await integranteCuerpoService.cambiarRol(
      id,
      rol_grupo_id,
      req.usuario?.rol,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene todas las integraciones de un miembro
   * GET /api/integrantes-cuerpo/miembro/:miembro_id
   */
  public getIntegrantesByMiembro: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = Number.parseInt(req.params.miembro_id, 10);
    const serviceResponse = await integranteCuerpoService.getIntegrantesByMiembro(
      miembroId,
      req.usuario?.rol,
      req.usuario?.miembro_id ?? null,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene todas las integraciones activas de un grupo
   * GET /api/integrantes-cuerpo/grupo/:grupo_id
   */
  public getIntegrantesByGrupo: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const serviceResponse = await integranteCuerpoService.getIntegrantesByGrupo(grupoId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const integranteCuerpoController = new IntegranteCuerpoController();
