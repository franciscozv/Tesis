import type { Request, RequestHandler, Response } from 'express';
import { integranteGrupoService } from './integranteGrupoService';

/**
 * Controller para manejar requests HTTP de Integrantes en Grupo
 */
class IntegranteGrupoController {
  /**
   * Vincula un miembro a un grupo ministerial (RF_06)
   * POST /api/integrantes-grupo
   */
  public vincularMiembro: RequestHandler = async (req: Request, res: Response) => {
    const { miembro_id, grupo_id, rol_grupo_id, fecha_vinculacion } = req.body;
    const serviceResponse = await integranteGrupoService.vincularMiembro(
      miembro_id,
      grupo_id,
      rol_grupo_id,
      fecha_vinculacion,
      req.usuario!,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Desvincular un miembro de un grupo ministerial (RF_07)
   * PATCH /api/integrantes-grupo/:id/desvincular
   */
  public desvincularMiembro: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { fecha_desvinculacion } = req.body;
    const serviceResponse = await integranteGrupoService.desvincularMiembro(
      id,
      fecha_desvinculacion,
      req.usuario!,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el rol de una integración activa
   * PATCH /api/integrantes-grupo/:id/cambiar-rol
   */
  public cambiarRol: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { rol_grupo_id } = req.body;
    const serviceResponse = await integranteGrupoService.cambiarRol(
      id,
      rol_grupo_id,
      req.usuario!,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene todas las integraciones de un miembro
   * GET /api/integrantes-grupo/miembro/:miembro_id
   */
  public getIntegrantesByMiembro: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = Number.parseInt(req.params.miembro_id, 10);
    const serviceResponse = await integranteGrupoService.getIntegrantesByMiembro(
      miembroId,
      req.usuario?.rol,
      req.usuario?.id ?? null,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene todas las integraciones activas de un grupo
   * GET /api/integrantes-grupo/grupo/:grupo_id
   */
  public getIntegrantesByGrupo: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const serviceResponse = await integranteGrupoService.getIntegrantesByGrupo(grupoId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Renovación masiva de directiva
   * POST /api/integrantes-grupo/grupo/:grupo_id/renovar-directiva
   */
  public renovarDirectivaMasiva: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const { renovaciones, fecha } = req.body;
    const serviceResponse = await integranteGrupoService.renovarDirectivaMasiva(
      grupoId,
      renovaciones,
      fecha,
      req.usuario!,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Historial de directiva de un grupo
   * GET /api/integrantes-grupo/grupo/:grupo_id/historial-directiva
   */
  public getHistorialDirectiva: RequestHandler = async (req: Request, res: Response) => {
    const grupoId = Number.parseInt(req.params.grupo_id, 10);
    const serviceResponse = await integranteGrupoService.getHistorialDirectiva(
      grupoId,
      req.usuario!,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const integranteGrupoController = new IntegranteGrupoController();
