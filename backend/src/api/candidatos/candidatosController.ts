import type { Request, RequestHandler, Response } from 'express';
import { candidatosService } from './candidatosService';

/**
 * Controlador para manejar peticiones HTTP de sugerencia de candidatos
 */
class CandidatosController {
  /**
   * Sugiere candidatos para un rol en actividad (indicadores crudos, sin scoring)
   */
  public sugerirRol: RequestHandler = async (req: Request, res: Response) => {
    const { rol_id, fecha, tipo_actividad_id, cuerpo_id, periodo_meses, filtro_plena_comunion } =
      req.body;
    const serviceResponse = await candidatosService.sugerirParaRol(rol_id, fecha, {
      tipoActividadId: tipo_actividad_id,
      periodoMeses: periodo_meses ?? 12,
      filtroPlenaComun: filtro_plena_comunion,
      cuerpoIdBody: cuerpo_id,
      usuario: req.usuario,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Sugiere candidatos para un cargo en grupo (indicadores crudos, sin scoring)
   */
  public sugerirCargo: RequestHandler = async (req: Request, res: Response) => {
    const { cargo_id, cuerpo_id, periodo_meses } = req.body;
    const serviceResponse = await candidatosService.sugerirParaCargo(cargo_id, {
      periodoMeses: periodo_meses ?? 12,
      cuerpoIdBody: cuerpo_id,
      usuario: req.usuario,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const candidatosController = new CandidatosController();
