import type { Request, RequestHandler, Response } from 'express';
import { calendarioService } from './calendarioService';

/**
 * Controlador para endpoints del Calendario
 */
class CalendarioController {
  /**
   * GET /api/calendario/publico?mes=3&anio=2025
   */
  public getPublico: RequestHandler = async (req: Request, res: Response) => {
    const mes = Number(req.query.mes);
    const anio = Number(req.query.anio);
    const serviceResponse = await calendarioService.getCalendarioPublico(mes, anio);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /api/calendario/consolidado?mes=3&anio=2025&grupoId=5
   */
  public getConsolidado: RequestHandler = async (req: Request, res: Response) => {
    const mes = Number(req.query.mes);
    const anio = Number(req.query.anio);
    const grupoId = req.query.grupoId ? Number(req.query.grupoId) : undefined;
    const serviceResponse = await calendarioService.getCalendarioConsolidado(
      mes,
      anio,
      req.usuario!,
      grupoId,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * GET /api/calendario/mis-responsabilidades/:miembro_id
   */
  public getMisResponsabilidades: RequestHandler = async (req: Request, res: Response) => {
    const miembroId = Number(req.params.miembro_id);
    const miembroIdToken = req.usuario?.id ?? null;
    const serviceResponse = await calendarioService.getMisResponsabilidades(
      miembroId,
      miembroIdToken,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const calendarioController = new CalendarioController();
